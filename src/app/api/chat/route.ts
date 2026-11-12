import { NextResponse } from 'next/server';
import { AuthStore } from '@/lib/auth-store';
import { ChatStore } from '@/lib/chat-store';
import { AIProviderFactory } from '@/lib/ai/factory';

// Simple in-memory per-user rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 20; // max requests per minute
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
      return NextResponse.json({ error: 'Please log in to use AI chat.' }, { status: 401 });
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment before sending more messages.' }, { status: 429 });
    }

    const body = await req.json();
    const { conversationId, message, provider, model } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    if (message.length > 32000) {
      return NextResponse.json({ error: 'Message too long (max 32,000 characters).' }, { status: 400 });
    }

    const providerName = provider || 'openai';
    const modelId = model || '';

    // Validate provider
    const validProviders = ['openai', 'gemini', 'anthropic'];
    if (!validProviders.includes(providerName)) {
      return NextResponse.json({ error: `Unsupported provider: ${providerName}` }, { status: 400 });
    }

    // Get or create conversation
    let convo;
    if (conversationId) {
      convo = ChatStore.getConversation(conversationId);
      if (!convo || convo.userId !== user.id) {
        return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
      }
    } else {
      // Auto-create a new conversation
      const title = message.slice(0, 50).trim() || 'New Chat';
      convo = ChatStore.createConversation(user.id, providerName, modelId, title);
    }

    // Save user message
    ChatStore.addMessage(convo.id, 'user', message.trim());

    // Build messages array for context
    const contextMessages = convo.messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }));

    // Call AI provider
    let aiProvider;
    try {
      aiProvider = AIProviderFactory.getProvider(providerName);
    } catch (err: any) {
      const envVarMap: Record<string, string> = {
        openai: 'OPENAI_API_KEY',
        gemini: 'GEMINI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY'
      };
      const envVar = envVarMap[providerName] || '';
      return NextResponse.json({
        error: `${providerName.charAt(0).toUpperCase() + providerName.slice(1)} API key is not configured. Please set the ${envVar} environment variable in your Vercel project settings.`,
        configError: true,
        envVar
      }, { status: 503 });
    }

    try {
      const selectedModel = modelId || undefined;
      const response = await aiProvider.sendMessage(contextMessages, { model: selectedModel });

      // Handle non-streaming response
      const aiResponse = response as { role: string; content: string; usageTokens?: number };
      const assistantContent = aiResponse.content || '';
      const usage = aiResponse.usageTokens;

      // Save assistant message
      ChatStore.addMessage(convo.id, 'assistant', assistantContent, usage);

      // Auto-title: if this is the first exchange, update title from user message
      if (convo.messages.length <= 2) {
        const autoTitle = message.slice(0, 60).trim();
        ChatStore.renameConversation(convo.id, autoTitle);
        convo.title = autoTitle;
      }

      return NextResponse.json({
        conversationId: convo.id,
        response: assistantContent,
        usage,
        title: convo.title
      });

    } catch (apiError: any) {
      const errorMsg = apiError.message || 'AI provider returned an error.';
      
      // Detect common error patterns
      if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('Invalid API')) {
        return NextResponse.json({
          error: `Invalid API key for ${providerName}. Please check your API key configuration.`,
          configError: true
        }, { status: 401 });
      }

      if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
        return NextResponse.json({
          error: `API rate limit or quota exceeded for ${providerName}. Your free tier credits may have been used up. Please check your provider billing dashboard.`
        }, { status: 429 });
      }

      if (errorMsg.includes('insufficient') || errorMsg.includes('billing') || errorMsg.includes('credit')) {
        return NextResponse.json({
          error: `Insufficient API credits for ${providerName}. Please add credits to your provider account.`
        }, { status: 402 });
      }

      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
