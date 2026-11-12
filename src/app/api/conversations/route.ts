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

// GET /api/conversations — list user conversations
export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const conversations = ChatStore.listUserConversations(user.id);
  return NextResponse.json({ conversations });
}

// POST /api/conversations — create new conversation
export async function POST(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const { provider, model, title } = await req.json();
  if (!provider || !model) {
    return NextResponse.json({ error: 'provider and model are required' }, { status: 400 });
  }
  const convo = ChatStore.createConversation(user.id, provider, model, title || 'New Chat');
  return NextResponse.json({ conversation: convo });
}

// PATCH /api/conversations — rename
export async function PATCH(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const { conversationId, title } = await req.json();
  if (!conversationId || !title) {
    return NextResponse.json({ error: 'conversationId and title are required' }, { status: 400 });
  }
  const convo = ChatStore.getConversation(conversationId);
  if (!convo || convo.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  ChatStore.renameConversation(conversationId, title);
  return NextResponse.json({ success: true });
}

// DELETE /api/conversations
export async function DELETE(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('id');
  if (!conversationId) {
    return NextResponse.json({ error: 'id param required' }, { status: 400 });
  }
  const convo = ChatStore.getConversation(conversationId);
  if (!convo || convo.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  ChatStore.deleteConversation(conversationId);
  return NextResponse.json({ success: true });
}
