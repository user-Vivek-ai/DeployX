import { NextResponse } from 'next/server';
import { AuthStore } from '@/lib/auth-store';
import { ChatStore } from '@/lib/chat-store';

function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization');
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/deployx_token=([^;]+)/);
    if (match) token = match[1];
  }
  if (!token) return null;
  return AuthStore.validateSession(token);
}

// GET /api/conversations/[id]
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const convo = ChatStore.getConversation(params.id);
  if (!convo || convo.userId !== user.id) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  return NextResponse.json({ conversation: convo });
}

// DELETE /api/conversations/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const convo = ChatStore.getConversation(params.id);
  if (!convo || convo.userId !== user.id) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  ChatStore.deleteConversation(params.id);
  return NextResponse.json({ success: true });
}
