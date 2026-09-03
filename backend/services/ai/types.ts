export {};

export type AIProviderName = 'gemini' | 'ollama';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  jsonSchema?: Record<string, any>;
  timeoutMs?: number;
}

export interface AIResponse {
  content: string;
  parsedJson: Record<string, any> | null;
  provider: AIProviderName;
  tokensUsed?: number;
  latencyMs: number;
}

export interface AIHealthStatus {
  provider: AIProviderName;
  configured: boolean;
  available: boolean;
  model?: string;
  error?: string;
  latencyMs?: number;
}

export interface AIProvider {
  name: AIProviderName;
  isConfigured(): boolean;
  generate(request: AIRequest): Promise<AIResponse>;
  healthCheck(): Promise<AIHealthStatus>;
}
