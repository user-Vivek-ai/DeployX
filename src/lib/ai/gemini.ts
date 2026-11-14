import { AIProvider, ModelInfo, AIResponse, ChatMessage } from '@/lib/ai/provider';

// Static cache to avoid rediscovering on every invocation
let cachedWorkingEndpoint: string | null = null;
let cachedWorkingModel: string | null = null;

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

  /**
   * Dynamically query Google's ModelService.ListModels to detect all supported models
   * for this specific API key.
   */
  async getAvailableGoogleModels(): Promise<string[]> {
    const urls = [
      `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models?key=${this.apiKey}`
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data.models && Array.isArray(data.models)) {
            // Filter models that support generateContent
            const supported = data.models
              .filter((m: any) =>
                m.supportedGenerationMethods?.includes('generateContent') ||
                m.supportedGenerationMethods?.includes('generate_content')
              )
              .map((m: any) => m.name.replace(/^models\//, ''));

            if (supported.length > 0) {
              return supported;
            }
          }
        }
      } catch {
        // Continue to fallback candidates
      }
    }
    return [];
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        provider: 'gemini',
        id: 'gemini-1.5-flash-latest',
        name: 'Gemini 1.5 Flash',
        description: 'Google’s ultra-fast, cost-effective multimodal model with generous free tier',
        capabilities: ['text', 'multimodal', 'speed']
      },
      {
        provider: 'gemini',
        id: 'gemini-1.5-pro-latest',
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

    // Build ordered list of candidates to try across both v1 and v1beta
    const requestedModel = (options?.model || 'gemini-1.5-flash').replace(/^models\//, '');

    // If we already know a working model & endpoint from a previous turn, prioritize it
    const candidateConfigs: Array<{ apiVersion: 'v1' | 'v1beta'; model: string }> = [];

    if (cachedWorkingEndpoint && cachedWorkingModel) {
      candidateConfigs.push({
        apiVersion: cachedWorkingEndpoint as 'v1' | 'v1beta',
        model: cachedWorkingModel
      });
    }

    // Dynamically discover supported models via ListModels if not cached
    if (candidateConfigs.length === 0) {
      try {
        const discovered = await this.getAvailableGoogleModels();
        if (discovered.length > 0) {
          // Sort discovered models so flash / 1.5 models come first
          const preferred = discovered.sort((a, b) => {
            const score = (name: string) => {
              if (name.includes('1.5-flash')) return 100;
              if (name.includes('flash')) return 80;
              if (name.includes('1.5-pro')) return 60;
              if (name.includes('pro')) return 40;
              return 10;
            };
            return score(b) - score(a);
          });

          for (const m of preferred) {
            candidateConfigs.push({ apiVersion: 'v1beta', model: m });
            candidateConfigs.push({ apiVersion: 'v1', model: m });
          }
        }
      } catch {
        // Fallback to static candidate matrix
      }
    }

    // Comprehensive fallback candidate matrix
    const standardModels = [
      requestedModel,
      `${requestedModel}-latest`,
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-001',
      'gemini-1.5-flash-002',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      'gemini-pro'
    ];

    // Deduplicate and push candidates for both v1beta and v1
    for (const m of standardModels) {
      if (!candidateConfigs.some(c => c.model === m && c.apiVersion === 'v1beta')) {
        candidateConfigs.push({ apiVersion: 'v1beta', model: m });
      }
      if (!candidateConfigs.some(c => c.model === m && c.apiVersion === 'v1')) {
        candidateConfigs.push({ apiVersion: 'v1', model: m });
      }
    }

    let lastError: Error | null = null;

    // Try candidates until one succeeds
    for (const config of candidateConfigs) {
      const endpoint = `https://generativelanguage.googleapis.com/${config.apiVersion}/models/${config.model}:generateContent?key=${this.apiKey}`;

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.status === 404) {
          // Model not found in this endpoint / version, try next candidate
          continue;
        }

        if (!res.ok) {
          const errText = await res.text();
          let parsedMsg = errText;
          try {
            const parsed = JSON.parse(errText);
            parsedMsg = parsed.error?.message || errText;
          } catch {}

          // If rate limit or another non-404 error, store and try fallback or break
          if (res.status === 429) {
            throw new Error(`Google Gemini rate limit exceeded. Please wait a moment.`);
          }
          lastError = new Error(`Google Gemini API error (${res.status}): ${parsedMsg}`);
          continue;
        }

        const data = await res.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text || '';
        const usage = data.usageMetadata?.totalTokenCount;

        // Remember this working configuration!
        cachedWorkingEndpoint = config.apiVersion;
        cachedWorkingModel = config.model;

        return {
          role: 'assistant',
          content: text,
          usageTokens: usage
        };
      } catch (err: any) {
        if (err.message.includes('rate limit')) {
          throw err;
        }
        lastError = err;
      }
    }

    throw lastError || new Error('Google Gemini API could not find a supported model for this API key.');
  }
}
