import { NextResponse } from 'next/server';
import { AuthStore } from '@/lib/auth-store';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = AuthStore.login(email, password);

    if (!result.success || !result.token) {
      return NextResponse.json({ error: result.error || 'Authentication failed' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Sign in successful! Welcome to DeployX.',
      user: result.user,
      token: result.token
    });

    // Set auth cookie
    response.cookies.set({
      name: 'deployx_token',
      value: result.token,
      httpOnly: false, // Accessible to client-side auth context
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'lax'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
