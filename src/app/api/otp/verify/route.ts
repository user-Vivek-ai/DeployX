import { NextResponse } from 'next/server';
import { OTPService } from '@/lib/integrations/otp-service';

export async function POST(req: Request) {
  try {
    const { target, code } = await req.json();
    if (!target || !code) {
      return NextResponse.json({ error: 'Target and code are required' }, { status: 400 });
    }

    const result = OTPService.verifyOTP(target, code);
    if (!result.success) {
      return NextResponse.json({
        error: result.error,
        attemptsRemaining: result.attemptsRemaining
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
