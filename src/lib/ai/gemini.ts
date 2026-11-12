import { AIProvider, ModelInfo, AIResponse, ChatMessage } from '@/lib/ai/provider';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider extends AIProvider {
  private client: GoogleGenerativeAI;

  constructor() {
    super();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey || apiKey.includes('placeholder')) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        provider: 'gemini',
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast, highly capable, free-tier friendly model',
        capabilities: ['text', 'multimodal']
      },
      {
        provider: 'gemini',
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Advanced reasoning and long-context multimodal intelligence',
        capabilities: ['text', 'multimodal', 'complex-reasoning']
      },
      {
        provider: 'gemini',
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Next-generation speed and multimodal capabilities',
        capabilities: ['text', 'multimodal']
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

    const model = this.client.getGenerativeModel({
      model: modelId,
      ...(systemInstruction ? { systemInstruction } : {})
    });

    // Format contents: Gemini requires alternating 'user' and 'model'
    // Ensure role is mapped properly: 'assistant' -> 'model'
    const nonSystemMessages = messages.filter(m => m.role !== 'system');
    
    // Ensure at least one message
    if (nonSystemMessages.length === 0) {
      throw new Error('No messages provided to Gemini');
    }

    const contents = nonSystemMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    if (options?.stream) {
      const streamResult = await model.generateContentStream({ contents: contents as any });
      const asyncIter = (async function* () {
        for await (const chunk of streamResult.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            yield { role: 'assistant', content: chunkText } as AIResponse;
          }
        }
      })();
      return asyncIter;
    }

    const result = await model.generateContent({ contents: contents as any });
    const text = result.response?.text() || '';
    const usage = result.response?.usageMetadata?.totalTokenCount;

    return {
      role: 'assistant',
      content: text,
      usageTokens: usage
    };
  }
}
