import { AIProviderId, ProviderConfig } from '../../types';

export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: PromptMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  content: string;
  provider: AIProviderId;
  model: string;
  latencyMs: number;
  tokensUsed?: number;
}

export interface AIProvider {
  id: AIProviderId;
  name: string;
  testConnection(config: ProviderConfig): Promise<{ success: boolean; latencyMs: number; message: string }>;
  generateCompletion(config: ProviderConfig, request: CompletionRequest): Promise<CompletionResponse>;
  generateStream(
    config: ProviderConfig,
    request: CompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<CompletionResponse>;
}
