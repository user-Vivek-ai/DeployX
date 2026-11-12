import { NextResponse } from 'next/server';
import { z } from 'zod';

const providerSchema = z.enum(['openai', 'gemini', 'anthropic']).optional();

// Static model definitions — these are returned even if the API key is missing,
// so the UI can always show the model selector. Whether the key is configured
// is indicated by the `keyConfigured` flag.
function getStaticModels() {
  const openaiKey = Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder'));
  const geminiKey = Boolean(
    (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) &&
    !(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').includes('placeholder')
  );
  const anthropicKey = Boolean(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('placeholder'));

  return [
    // ---------- OpenAI ----------
    { provider: 'openai', id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast, affordable small model', capabilities: ['text', 'image'], keyConfigured: openaiKey },
    { provider: 'openai', id: 'gpt-4o', name: 'GPT-4o', description: 'High-quality multimodal model', capabilities: ['text', 'image', 'tools'], keyConfigured: openaiKey },
    { provider: 'openai', id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Advanced reasoning with vision', capabilities: ['text', 'image'], keyConfigured: openaiKey },
    { provider: 'openai', id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective', capabilities: ['text'], keyConfigured: openaiKey },
    // ---------- Gemini ----------
    { provider: 'gemini', id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'High-quality multimodal model', capabilities: ['text', 'image'], keyConfigured: geminiKey },
    { provider: 'gemini', id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast, cost-effective model', capabilities: ['text', 'image'], keyConfigured: geminiKey },
    { provider: 'gemini', id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest fast model', capabilities: ['text', 'image'], keyConfigured: geminiKey },
    // ---------- Anthropic ----------
    { provider: 'anthropic', id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Latest balanced model', capabilities: ['text', 'image'], keyConfigured: anthropicKey },
    { provider: 'anthropic', id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'High-quality reasoning model', capabilities: ['text', 'image'], keyConfigured: anthropicKey },
    { provider: 'anthropic', id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable model', capabilities: ['text'], keyConfigured: anthropicKey },
    { provider: 'anthropic', id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast, cost-effective model', capabilities: ['text'], keyConfigured: anthropicKey },
  ];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');
    const validated = providerSchema.safeParse(provider);

    let models = getStaticModels();

    if (validated.success && validated.data) {
      models = models.filter(m => m.provider === validated.data);
    }

    return NextResponse.json({ models });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
