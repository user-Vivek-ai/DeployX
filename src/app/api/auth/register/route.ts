import { NextResponse } from 'next/server';
import { AuthStore, validatePassword } from '@/lib/auth-store';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Password does not meet requirements',
        details: validation.errors
      }, { status: 422 });
    }

    const result = AuthStore.completeSignup(email, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Account successfully registered! Please sign in with your email and password.',
      user: result.user
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
