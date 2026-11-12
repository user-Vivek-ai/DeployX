import { AIProvider, ModelInfo, AIResponse, ChatMessage } from '@/lib/ai/provider';
import OpenAI from 'openai';

export class OpenAIProvider extends AIProvider {
  private client: OpenAI;

  constructor() {
    super();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.includes('placeholder')) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    this.client = new OpenAI({ apiKey });
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        provider: 'openai',
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Flagship omni-model for high-intelligence reasoning and text',
        capabilities: ['text', 'vision', 'multimodal', 'advanced-reasoning']
      },
      {
        provider: 'openai',
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast, lightweight and affordable intelligence for everyday tasks',
        capabilities: ['text', 'vision', 'speed']
      },
      {
        provider: 'openai',
        id: 'o1-mini',
        name: 'OpenAI o1 Mini',
        description: 'Specialized reasoning model for STEM, coding, and complex logic',
        capabilities: ['text', 'deep-reasoning', 'math-coding']
      },
      {
        provider: 'openai',
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'High-capability GPT-4 model with broad world knowledge',
        capabilities: ['text', 'vision']
      }
    ];
  }

  async sendMessage(
    messages: ChatMessage[],
    options?: { model?: string; stream?: boolean }
  ): Promise<AIResponse | AsyncIterable<AIResponse>> {
    const model = options?.model || 'gpt-4o-mini';
    const stream = options?.stream ?? false;
    const openAIMessages = messages.map(m => ({ role: m.role, content: m.content }));

    if (stream) {
      const streamResp = await this.client.chat.completions.create({
        model,
        messages: openAIMessages as any,
        stream: true
      });

      const asyncIter = (async function* () {
        for await (const chunk of streamResp) {
          if (chunk.choices[0]?.delta?.content) {
            yield { role: 'assistant', content: chunk.choices[0].delta.content } as AIResponse;
          }
        }
      })();
      return asyncIter;
    } else {
      const completion = await this.client.chat.completions.create({
        model,
        messages: openAIMessages as any
      });

      const content = completion.choices[0]?.message?.content || '';
      const usage = completion.usage?.total_tokens;

      return {
        role: 'assistant',
        content,
        usageTokens: usage
      };
    }
  }
}
