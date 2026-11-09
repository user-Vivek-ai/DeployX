import { NextResponse } from 'next/server';
import { AuthStore } from '@/lib/auth-store';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/deployx_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (token) {
      AuthStore.logout(token);
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.delete('deployx_token');
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Logout failed' }, { status: 500 });
  }
}
