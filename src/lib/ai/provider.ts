export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ModelInfo {
  provider: string; // openai | gemini | anthropic
  id: string; // model identifier
  name: string; // friendly name
  description: string;
  capabilities: string[]; // e.g., ['text', 'image', 'tools']
}

export interface AIResponse {
  role: 'assistant';
  content: string;
  usageTokens?: number;
}

/**
 * Base class that each provider must implement.
 * The `stream` option indicates whether the caller wants a streaming response.
 */
export abstract class AIProvider {
  abstract listModels(): Promise<ModelInfo[]>;
  abstract sendMessage(
    messages: ChatMessage[],
    options?: { model?: string; stream?: boolean }
  ): Promise<AIResponse | AsyncIterable<AIResponse>>;
}
