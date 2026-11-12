import { AIProvider, ModelInfo, AIResponse, ChatMessage } from '@/lib/ai/provider';

export class OpenAIProvider extends AIProvider {
  private apiKey: string;

  constructor() {
    super();
    const key = process.env.OPENAI_API_KEY;
    if (!key || key.includes('placeholder')) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    this.apiKey = key;
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        provider: 'openai',
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Flagship omni-intelligence for complex reasoning and analysis',
        capabilities: ['text', 'vision', 'reasoning']
      },
      {
        provider: 'openai',
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Affordable, low-latency intelligence for everyday questions',
        capabilities: ['text', 'speed']
      },
      {
        provider: 'openai',
        id: 'o1-mini',
        name: 'o1-mini',
        description: 'Specialized reasoning model for coding, STEM, and logic',
        capabilities: ['text', 'deep-reasoning']
      },
      {
        provider: 'openai',
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'High-capability GPT-4 model with wide context',
        capabilities: ['text']
      }
    ];
  }

  async sendMessage(
    messages: ChatMessage[],
    options?: { model?: string; stream?: boolean }
  ): Promise<AIResponse | AsyncIterable<AIResponse>> {
    const model = options?.model || 'gpt-4o-mini';
    const openAIMessages = messages.map(m => ({ role: m.role, content: m.content }));

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: openAIMessages
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        parsedMsg = parsed.error?.message || errText;
      } catch {}
      throw new Error(`OpenAI API error (${res.status}): ${parsedMsg}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage?.total_tokens;

    return {
      role: 'assistant',
      content,
      usageTokens: usage
    };
  }
}
