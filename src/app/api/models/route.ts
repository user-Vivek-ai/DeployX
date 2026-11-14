import { NextResponse } from 'next/server';

export async function GET() {
  const geminiConfigured = Boolean(
    (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) &&
    !(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').includes('placeholder')
  );

  return NextResponse.json({
    activeProvider: geminiConfigured ? 'gemini' : null,
    freeTierAvailable: geminiConfigured,
    model: {
      name: 'Gemini 1.5 Flash',
      provider: 'Google Gemini (Free Tier)',
      tier: '100% Free under Google AI Studio terms (15 req/min, 0 charges)',
      configured: geminiConfigured
    },
    paidApisStatus: 'disabled',
    disclaimer: 'DeployX does not use paid API keys (OpenAI / Anthropic) to guarantee zero charges.'
  });
}
