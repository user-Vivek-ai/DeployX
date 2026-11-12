import { AIProvider, ModelInfo, AIResponse, ChatMessage } from '@/lib/ai/provider';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider extends AIProvider {
  private client: Anthropic;

  constructor() {
    super();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.includes('placeholder')) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    this.client = new Anthropic({ apiKey });
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        provider: 'anthropic',
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Industry-leading intelligence, coding, and nuanced reasoning',
        capabilities: ['text', 'vision', 'complex-reasoning']
      },
      {
        provider: 'anthropic',
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Blazing fast intelligence with near-instant responsiveness',
        capabilities: ['text', 'speed']
      },
      {
        provider: 'anthropic',
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Deep analytical power for complex open-ended problems',
        capabilities: ['text', 'vision', 'deep-analysis']
      }
    ];
  }

  async sendMessage(
    messages: ChatMessage[],
    options?: { model?: string; stream?: boolean }
  ): Promise<AIResponse | AsyncIterable<AIResponse>> {
    const model = options?.model || 'claude-3-5-sonnet-20241022';
    const stream = options?.stream ?? false;

    // Extract system prompt separately (Anthropic requires system as top-level param)
    const systemPrompt = messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n\n');

    // Only pass user and assistant roles to Anthropic
    const chatMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    if (chatMessages.length === 0) {
      throw new Error('No user or assistant messages provided to Anthropic');
    }

    if (stream) {
      const streamResp = await this.client.messages.stream({
        model,
        max_tokens: 4096,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: chatMessages
      });

      const asyncIter = (async function* () {
        for await (const chunk of streamResp) {
          if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
            yield { role: 'assistant', content: chunk.delta.text } as AIResponse;
          }
        }
      })();
      return asyncIter;
    } else {
      const resp = await this.client.messages.create({
        model,
        max_tokens: 4096,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: chatMessages
      });

      const text = resp.content
        .filter(c => c.type === 'text')
        .map(c => (c as any).text)
        .join('');
      const usage = (resp.usage?.input_tokens || 0) + (resp.usage?.output_tokens || 0);

      return {
        role: 'assistant',
        content: text,
        usageTokens: usage
      };
    }
  }
}
