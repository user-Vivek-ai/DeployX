import { NextResponse } from 'next/server';
import { AuthStore } from '@/lib/auth-store';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Check cookies
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/deployx_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = AuthStore.validateSession(token);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
