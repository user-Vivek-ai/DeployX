import { NextResponse } from 'next/server';
import { AuthStore } from '@/lib/auth-store';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are all required.' },
        { status: 400 }
      );
    }

    const result = AuthStore.initiateTotpSignup(email, name, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      secret: result.secret,
      otpAuthUrl: result.otpAuthUrl,
      qrCodeUrl: result.qrCodeUrl
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to initiate authenticator setup' },
      { status: 500 }
    );
  }
}
