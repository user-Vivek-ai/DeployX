import { AIProvider, ModelInfo, AIResponse, ChatMessage } from '@/lib/ai/provider';

export class AnthropicProvider extends AIProvider {
  private apiKey: string;

  constructor() {
    super();
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key || key.includes('placeholder')) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    this.apiKey = key;
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        provider: 'anthropic',
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Anthropic’s smartest model — state-of-the-art coding and reasoning',
        capabilities: ['text', 'coding', 'reasoning']
      },
      {
        provider: 'anthropic',
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Instant response time with unmatched speed and concise answers',
        capabilities: ['text', 'speed']
      },
      {
        provider: 'anthropic',
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Powerhouse intelligence for long-form analysis and creative writing',
        capabilities: ['text', 'deep-thinking']
      }
    ];
  }

  async sendMessage(
    messages: ChatMessage[],
    options?: { model?: string; stream?: boolean }
  ): Promise<AIResponse | AsyncIterable<AIResponse>> {
    const model = options?.model || 'claude-3-5-sonnet-20241022';

    // Separate system messages
    const systemPrompt = messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n\n');

    // Only pass user and assistant roles
    const chatMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    if (chatMessages.length === 0) {
      throw new Error('No user or assistant messages provided to Anthropic');
    }

    const payload: any = {
      model,
      max_tokens: 4096,
      messages: chatMessages
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
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
      throw new Error(`Anthropic Claude API error (${res.status}): ${parsedMsg}`);
    }

    const data = await res.json();
    const text = (data.content || [])
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('');
    const usage = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    return {
      role: 'assistant',
      content: text,
      usageTokens: usage
    };
  }
}
