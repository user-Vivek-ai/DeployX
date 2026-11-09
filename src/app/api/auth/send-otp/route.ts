import { NextResponse } from 'next/server';
import { AuthStore } from '@/lib/auth-store';

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

    return NextResponse.json({
      success: true,
      message: `Verification OTP dispatched to ${email}`,
      demoOtp: result.demoOtp,
      expiresInSeconds: result.expiresInSeconds
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to dispatch OTP' }, { status: 500 });
  }
}
