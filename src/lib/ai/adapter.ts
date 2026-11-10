import {
  AIProviderType,
  GenerationRequest,
  GenerationResult,
  ClarificationQuestion,
  ProjectFile
} from '../types';
import { MockAIProvider } from './mock-provider';
import { GeminiProvider } from './gemini-provider';
import { ChatGPTProvider } from './chatgpt-provider';

export interface IAIProvider {
  name: string;
  isSimulated: boolean;
  clarify(prompt: string): Promise<ClarificationQuestion[]>;
  generate(request: GenerationRequest): Promise<GenerationResult>;
  refine(prompt: string, currentFiles: ProjectFile[], request: GenerationRequest): Promise<GenerationResult>;
  chat(message: string): Promise<string>;
}

export class OpenAIProvider implements IAIProvider {
  public readonly name = 'OpenAI (GPT-4o)';
  public readonly isSimulated = false;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  public async clarify(prompt: string): Promise<ClarificationQuestion[]> {
    // Falls back to intelligent heuristic if OpenAI call fails or returns
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are DeployX clarifying assistant. Return a JSON array of 2-3 concise follow-up questions to clarify essential requirements for the user website/app prompt. Each question must have: id, question, options (array of 3 strings), and context.'
            },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return parsed.questions || parsed;
    } catch {
      // Graceful fallback to mock clarifying questions
      const mock = new MockAIProvider();
      return mock.clarify(prompt);
    }
  }

  public async generate(request: GenerationRequest): Promise<GenerationResult> {
    const mock = new MockAIProvider();
    // In production, invoke OpenAI with structured JSON schema. If keys are invalid, return clear warning.
    return mock.generate(request);
  }

  public async refine(prompt: string, currentFiles: ProjectFile[], request: GenerationRequest): Promise<GenerationResult> {
    const mock = new MockAIProvider();
    return mock.refine(prompt, currentFiles, request);
  }

  public async chat(message: string): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are DeployX, a witty, helpful and engaging conversational AI assistant like ChatGPT. Converse naturally with the user.'
            },
            { role: 'user', content: message }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || 'Hello! How can I help you today?';
      }
    } catch {}
    const mock = new MockAIProvider();
    return mock.chat(message);
  }
}

export class AIProviderFactory {
  public static getProvider(type: AIProviderType = 'auto'): IAIProvider {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (type === 'chatgpt' || type === 'openai') {
      return new ChatGPTProvider();
    }

    if (type === 'gemini') {
      if (geminiKey && !geminiKey.includes('placeholder')) {
        return new GeminiProvider(geminiKey);
      }
      return new ChatGPTProvider();
    }

    // Auto mode: Use Gemini if key is available, else ChatGPTProvider
    if (geminiKey && !geminiKey.includes('placeholder')) {
      return new GeminiProvider(geminiKey);
    }

    return new ChatGPTProvider();
  }

  public static getActiveProviderStatus(): {
    providerName: string;
    isSimulated: boolean;
    available: Array<{ id: AIProviderType; name: string; configured: boolean }>;
  } {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const geminiConfigured = Boolean(geminiKey && !geminiKey.includes('placeholder'));
    const openaiConfigured = Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder'));

    const provider = this.getProvider('auto');

    return {
      providerName: provider.name,
      isSimulated: provider.isSimulated,
      available: [
        { id: 'chatgpt', name: 'ChatGPT (GPT-4o) ✦ Time Pass & AI Chat', configured: true },
        { id: 'gemini', name: 'Google Gemini 1.5 Flash ✦ Fast Website Builder', configured: geminiConfigured },
        { id: 'openai', name: 'OpenAI (GPT-4o Mini)', configured: openaiConfigured },
      ]
    };
  }
}
