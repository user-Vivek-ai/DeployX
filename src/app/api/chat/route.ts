import { NextResponse } from 'next/server';
import { AuthStore } from '@/lib/auth-store';
import { ChatStore } from '@/lib/chat-store';
import { AnthropicProvider } from '@/lib/ai/anthropic';
import { GeminiProvider } from '@/lib/ai/gemini';
import { DEPLOYX_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';

// In-memory per-user rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 25; // max 25 req/min
const RATE_WINDOW = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) || []).filter(t => now - t < RATE_WINDOW);
  if (timestamps.length >= RATE_LIMIT) return false;
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return true;
}

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

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to access your chat history.' }, { status: 401 });
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json({
        error: 'Rate limit reached. Please wait a few seconds before sending another message.'
      }, { status: 429 });
    }

    const body = await req.json();
    const { conversationId, message, attachments } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    // Get or create conversation
    let convo;
    if (conversationId) {
      convo = ChatStore.getConversation(conversationId);
      if (!convo || convo.userId !== user.id) {
        return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
      }
    } else {
      const title = message.slice(0, 48).trim() || 'New conversation';
      convo = ChatStore.createConversation(user.id, 'claude', 'claude-3-5-sonnet-20241022', title);
    }

    // Append attachments context if provided
    let fullUserContent = message.trim();
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attachmentSummaries = attachments
        .map((a: { name: string; content?: string }) => `\n[Attached File: "${a.name}"]:\n${a.content || '(binary / image content)'}`)
        .join('\n\n');
      fullUserContent += `\n\n--- User Attachments ---${attachmentSummaries}`;
    }

    // Save user message to persistent history
    ChatStore.addMessage(convo.id, 'user', message.trim());

    // Build context history with system prompt
    const contextMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      { role: 'system', content: DEPLOYX_SYSTEM_PROMPT }
    ];

    // Add prior conversation turns
    convo.messages.forEach((m, idx) => {
      // For the last message, use the one with attachments if applicable
      const isLast = idx === convo.messages.length - 1 && m.role === 'user';
      contextMessages.push({
        role: m.role,
        content: isLast ? fullUserContent : m.content
      });
    });

    let assistantContent = '';
    let providerUsed = 'claude';

    // 1. Try Anthropic Claude if ANTHROPIC_API_KEY is configured
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey && !anthropicKey.includes('placeholder')) {
      try {
        const claude = new AnthropicProvider();
        const response = await claude.sendMessage(contextMessages, {
          model: 'claude-3-5-sonnet-20241022'
        });
        const resObj = response as { role: string; content: string; usageTokens?: number };
        assistantContent = (resObj.content || '').trim();
        providerUsed = 'claude';
      } catch (claudeErr: any) {
        console.warn('Anthropic call encountered error, checking fallback:', claudeErr.message);
      }
    }

    // 2. If Anthropic wasn't configured or failed, fallback to Google Gemini (which is already configured in Vercel!)
    if (!assistantContent) {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey && !geminiKey.includes('placeholder')) {
        try {
          const gemini = new GeminiProvider();
          const response = await gemini.sendMessage(contextMessages, {
            model: 'gemini-1.5-flash-latest'
          });
          const resObj = response as { role: string; content: string; usageTokens?: number };
          assistantContent = (resObj.content || '').trim();
          providerUsed = 'gemini';
        } catch (geminiErr: any) {
          throw new Error(`AI Provider Error: ${geminiErr.message}`);
        }
      }
    }

    if (!assistantContent) {
      return NextResponse.json({
        error: 'AI is currently unavailable: No active API key found for Claude (ANTHROPIC_API_KEY) or Gemini (GEMINI_API_KEY) in Vercel settings. Please configure an API key to enable responses.'
      }, { status: 503 });
    }

    // Save assistant message to persistent store
    ChatStore.addMessage(convo.id, 'assistant', assistantContent);

    // Auto-title on first turn
    if (convo.messages.length <= 2) {
      const autoTitle = message.slice(0, 48).trim();
      ChatStore.renameConversation(convo.id, autoTitle);
      convo.title = autoTitle;
    }

    return NextResponse.json({
      conversationId: convo.id,
      response: assistantContent,
      title: convo.title,
      provider: providerUsed
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
