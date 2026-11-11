import { NextResponse } from 'next/server';
import { AuthStore } from '@/lib/auth-store';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim().replace(/\D/g, '');

    if (cleanCode.length !== 6) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit verification code.' },
        { status: 400 }
      );
    }

    const result = AuthStore.verifyOTPAndCompleteRegistration(cleanEmail, cleanCode);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Verification failed.' },
        { status: 400 }
      );
    }

    if ((result as any).needsPassword) {
      return NextResponse.json({
        success: true,
        message: 'Email successfully verified with OTP! Please create your password.',
        needsPassword: true
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Email successfully verified! Welcome to DeployX.',
      user: result.user,
      token: result.token
    });

    // Set authentication session cookie (valid 7 days)
    response.cookies.set({
      name: 'deployx_token',
      value: result.token,
      httpOnly: false,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Verification failed.' },
      { status: 500 }
    );
  }
}
