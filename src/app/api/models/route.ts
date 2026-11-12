import { NextResponse } from 'next/server';

function getStaticModels() {
  const openaiKey = Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder'));
  const geminiKey = Boolean(
    (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) &&
    !(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').includes('placeholder')
  );
  const anthropicKey = Boolean(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('placeholder'));

  return [
    // ---------- OpenAI ----------
    { provider: 'openai', id: 'gpt-4o', name: 'GPT-4o', description: 'Flagship omni-intelligence for complex reasoning', capabilities: ['text', 'vision', 'reasoning'], badge: 'Flagship', keyConfigured: openaiKey },
    { provider: 'openai', id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast, lightweight intelligence for everyday tasks', capabilities: ['text', 'speed'], badge: 'Fast & Efficient', keyConfigured: openaiKey },
    { provider: 'openai', id: 'o1-mini', name: 'o1-mini', description: 'Specialized reasoning model for STEM and coding', capabilities: ['text', 'deep-reasoning'], badge: 'Deep Logic', keyConfigured: openaiKey },
    { provider: 'openai', id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High-capability model with wide context', capabilities: ['text'], badge: 'Advanced', keyConfigured: openaiKey },
    // ---------- Gemini ----------
    { provider: 'gemini', id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Ultra-fast multimodal model with generous free tier', capabilities: ['text', 'multimodal', 'speed'], badge: 'Free Tier', keyConfigured: geminiKey },
    { provider: 'gemini', id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Pro-tier model with 1M+ context and deep reasoning', capabilities: ['text', 'multimodal', 'long-context'], badge: '1M Context', keyConfigured: geminiKey },
    { provider: 'gemini', id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Next-generation speed and reasoning', capabilities: ['text', 'speed'], badge: 'Next-Gen', keyConfigured: geminiKey },
    // ---------- Anthropic ----------
    { provider: 'anthropic', id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'State-of-the-art coding, reasoning, and nuanced tone', capabilities: ['text', 'coding', 'reasoning'], badge: 'Best for Coding', keyConfigured: anthropicKey },
    { provider: 'anthropic', id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Lightning fast with near-instant responsiveness', capabilities: ['text', 'speed'], badge: 'Lightning Fast', keyConfigured: anthropicKey },
    { provider: 'anthropic', id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Powerhouse intelligence for deep analysis and writing', capabilities: ['text', 'deep-thinking'], badge: 'Deep Thinker', keyConfigured: anthropicKey },
  ];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');

    let models = getStaticModels();

    if (provider && ['openai', 'gemini', 'anthropic'].includes(provider.toLowerCase())) {
      models = models.filter(m => m.provider === provider.toLowerCase());
    }

    return NextResponse.json({ models });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
