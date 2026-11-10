import { NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const targetEmail = url.searchParams.get('to') || 'vivekakula2006@gmail.com';

  const result = await EmailService.sendVerificationOTP({
    toEmail: targetEmail,
    toName: 'DeployX Tester',
    otpCode: '123456'
  });

  return NextResponse.json({
    attemptedTo: targetEmail,
    result,
    envCheck: {
      hasEmailUser: Boolean(process.env.EMAIL_USER),
      emailUserValue: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.slice(0, 4)}***` : 'NOT_SET',
      hasEmailPass: Boolean(process.env.EMAIL_PASS),
      emailPassLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
      hasResendKey: Boolean(process.env.RESEND_API_KEY)
    }
  });
}
