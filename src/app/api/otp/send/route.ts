import { NextResponse } from 'next/server';
import { OTPService } from '@/lib/integrations/otp-service';

export async function POST(req: Request) {
  try {
    const { target, type = 'sms' } = await req.json();
    if (!target || typeof target !== 'string') {
      return NextResponse.json({ error: 'Valid target (phone or email) is required' }, { status: 400 });
    }

    const result = await OTPService.sendOTP(target, type);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 429 });
    }

    return NextResponse.json({
      success: true,
      expiresInSeconds: result.expiresInSeconds,
      providerUsed: result.providerUsed,
      isDemo: result.isDemo,
      demoHint: result.demoHint // Clearly provided only in demo mode for frictionless tester verification
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'OTP dispatch failed' }, { status: 500 });
  }
}
