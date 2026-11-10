import { NextResponse } from 'next/server';
import { AuthStore } from '@/lib/auth-store';
import { EmailService } from '@/lib/email-service';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const result = AuthStore.sendSignupOTP(email, name);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Dispatch real email via Resend, Brevo, SendGrid or Gmail SMTP
    const emailDispatch = await EmailService.sendVerificationOTP({
      toEmail: email.trim(),
      toName: name.trim(),
      otpCode: result.demoOtp
    });

    return NextResponse.json({
      success: true,
      message: emailDispatch.success
        ? `6-Digit verification code dispatched to ${email}. Check your inbox and spam folder.`
        : `Verification code generated for ${email}.`,
      emailSent: emailDispatch.success,
      serviceConfigured: emailDispatch.serviceConfigured,
      expiresInSeconds: result.expiresInSeconds,
      // Only include fallback code if no transactional email provider is configured in environment variables
      fallbackOtp: !emailDispatch.serviceConfigured ? result.demoOtp : undefined
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to dispatch OTP' }, { status: 500 });
  }
}
