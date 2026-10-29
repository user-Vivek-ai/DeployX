import { NextResponse } from 'next/server';
import { AIProviderFactory } from '@/lib/ai/adapter';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const provider = AIProviderFactory.getProvider('auto');
    const questions = await provider.clarify(prompt);

    return NextResponse.json({
      success: true,
      questions,
      providerUsed: provider.name,
      isSimulated: provider.isSimulated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Clarification failed' }, { status: 500 });
  }
}
