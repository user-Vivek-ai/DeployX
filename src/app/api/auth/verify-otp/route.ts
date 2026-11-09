import { NextResponse } from 'next/server';
import { AuthStore } from '@/lib/auth-store';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and 6-digit verification code are required' }, { status: 400 });
    }

    const result = AuthStore.verifySignupOTP(email, code);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email successfully verified with OTP! Please create your password.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
