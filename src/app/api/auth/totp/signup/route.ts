import { NextResponse } from 'next/server';
import { AuthStore, validatePassword } from '@/lib/auth-store';
import { TotpService } from '@/lib/totp';

export async function POST(req: Request) {
  try {
    const { name, email, password, secret, code } = await req.json();

    if (!name || !email || !password || !secret || !code) {
      return NextResponse.json(
        { error: 'All fields are required: Full Name, Email, Password, and 6-Digit Code.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanCode = code.trim().replace(/\D/g, '');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Password requirements: ${validation.errors.join(', ')}` },
        { status: 422 }
      );
    }

    if (cleanCode.length !== 6) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit code from Microsoft Authenticator.' },
        { status: 400 }
      );
    }

    // Verify TOTP token with ±1 window (30s drift tolerance)
    const isValid = TotpService.verifyToken(cleanCode, secret);
    if (!isValid) {
      return NextResponse.json(
        {
          error:
            'Invalid 6-digit code. Please enter the current code displayed in your Microsoft Authenticator app.'
        },
        { status: 401 }
      );
    }

    // Direct registration with validated Authenticator code
    const registration = AuthStore.registerDirectUser({
      name: cleanName,
      email: cleanEmail,
      password
    });

    if (!registration.success || !registration.token) {
      return NextResponse.json(
        { error: registration.error || 'Registration failed.' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Account verified and created successfully! Welcome to DeployX.',
      user: registration.user,
      token: registration.token
    });

    // Set authentication session cookie (valid 7 days)
    response.cookies.set({
      name: 'deployx_token',
      value: registration.token,
      httpOnly: false,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 500 }
    );
  }
}
