import { NextResponse } from 'next/server';
import { AuthStore } from '@/lib/auth-store';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and 6-digit code are required.' },
        { status: 400 }
      );
    }

    const result = AuthStore.verifyAndCompleteTotpSignup(email, code);

    if (!result.success || !result.token) {
      return NextResponse.json({ error: result.error || 'Verification failed' }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Account successfully verified and registered! Welcome to DeployX.',
      user: result.user,
      token: result.token
    });

    // Set auth cookie
    response.cookies.set({
      name: 'deployx_token',
      value: result.token,
      httpOnly: false,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'lax'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
