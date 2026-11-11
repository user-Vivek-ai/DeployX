import { NextResponse } from 'next/server';
import { AuthStore, validatePassword } from '@/lib/auth-store';
import { EmailService } from '@/lib/email-service';

export async function POST(req: Request) {
  try {
    const { email, name, password, isResend } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address (e.g. user@gmail.com).' }, { status: 400 });
    }

    let result;
    if (isResend) {
      result = AuthStore.resendOTP(cleanEmail);
    } else {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
      }
      if (password) {
        const validation = validatePassword(password);
        if (!validation.valid) {
          return NextResponse.json(
            { error: `Password requirements not met: ${validation.errors.join(', ')}` },
            { status: 422 }
          );
        }
      }
      result = AuthStore.initiateRegistration(name.trim(), cleanEmail, password);
    }

    if (!result.success || !result.otpCode) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to process registration request.',
          cooldownRemaining: result.cooldownRemaining
        },
        { status: result.cooldownRemaining ? 429 : 400 }
      );
    }

    // Dispatch real email via Gmail SMTP or Resend
    const recipientName = result.name || name || 'User';
    const emailDispatch = await EmailService.sendVerificationOTP({
      toEmail: cleanEmail,
      toName: recipientName,
      otpCode: result.otpCode
    });

    if (!emailDispatch.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Email delivery to ${cleanEmail} failed. ${emailDispatch.error || 'Please check email service credentials.'}`,
          emailSent: false,
          serviceConfigured: emailDispatch.serviceConfigured
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `6-Digit verification code dispatched to ${cleanEmail}. Check your inbox and spam folder.`,
      emailSent: true,
      expiresInSeconds: result.expiresInSeconds || 300,
      resendCooldownSeconds: 60
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process OTP request.' },
      { status: 500 }
    );
  }
}
