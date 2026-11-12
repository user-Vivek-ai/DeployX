import { OpenAIProvider } from '@/lib/ai/openai';
import { GeminiProvider } from '@/lib/ai/gemini';
import { AnthropicProvider } from '@/lib/ai/anthropic';
import { AIProvider } from '@/lib/ai/provider';

export class AIProviderFactory {
  static getProvider(name: string): AIProvider {
    const key = name.toLowerCase();
    switch (key) {
      case 'openai':
      case 'chatgpt':
        return new OpenAIProvider();
      case 'gemini':
      case 'google':
        return new GeminiProvider();
      case 'anthropic':
      case 'claude':
        return new AnthropicProvider();
      default:
        throw new Error(`Unsupported AI provider: ${name}`);
    }
  }

  static getProviderStatus(): {
    openai: boolean;
    gemini: boolean;
    anthropic: boolean;
  } {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    return {
      openai: Boolean(openaiKey && !openaiKey.includes('placeholder')),
      gemini: Boolean(geminiKey && !geminiKey.includes('placeholder')),
      anthropic: Boolean(anthropicKey && !anthropicKey.includes('placeholder'))
    };
  }
}
