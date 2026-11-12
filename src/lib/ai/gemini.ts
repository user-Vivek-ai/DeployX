import { AIProvider, ModelInfo, AIResponse, ChatMessage } from '@/lib/ai/provider';

export class GeminiProvider extends AIProvider {
  private apiKey: string;

  constructor() {
    super();
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key || key.includes('placeholder')) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.apiKey = key;
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        provider: 'gemini',
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Google’s ultra-fast, cost-effective multimodal model with generous free tier',
        capabilities: ['text', 'multimodal', 'speed']
      },
      {
        provider: 'gemini',
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Google’s top-tier model with 1M+ context and deep multimodal reasoning',
        capabilities: ['text', 'multimodal', 'long-context']
      },
      {
        provider: 'gemini',
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Next-generation speed and real-time multimodal capabilities',
        capabilities: ['text', 'speed']
      }
    ];
  }

  async sendMessage(
    messages: ChatMessage[],
    options?: { model?: string; stream?: boolean }
  ): Promise<AIResponse | AsyncIterable<AIResponse>> {
    const modelId = options?.model || 'gemini-1.5-flash';

    // Separate system messages if present
    const systemInstruction = messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n\n');

    // Gemini contents format
    const nonSystem = messages.filter(m => m.role !== 'system');
    if (nonSystem.length === 0) {
      throw new Error('No messages provided to Gemini');
    }

    const contents = nonSystem.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const payload: any = { contents };
    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${this.apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        parsedMsg = parsed.error?.message || errText;
      } catch {}
      throw new Error(`Google Gemini API error (${res.status}): ${parsedMsg}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';
    const usage = data.usageMetadata?.totalTokenCount;

    return {
      role: 'assistant',
      content: text,
      usageTokens: usage
    };
  }
}
