import { AIProvider, CompletionRequest, CompletionResponse } from './AIProvider';
import { ProviderConfig } from '../../types';

export class CustomProvider implements AIProvider {
  public readonly id = 'custom';
  public readonly name = 'Custom / Ollama';

  public async testConnection(
    config: ProviderConfig
  ): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const startTime = performance.now();
    try {
      const baseUrl = config.baseUrl.replace(/\/+$/, '');
      const headers: Record<string, string> = {};
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;

      const res = await fetch(`${baseUrl}/models`, { method: 'GET', headers });
      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        return { success: false, latencyMs, message: `Custom server HTTP ${res.status}: ${res.statusText}` };
      }
      return { success: true, latencyMs, message: `Connected to Custom API at ${baseUrl} (${latencyMs}ms)` };
    } catch (err: any) {
      return { success: false, latencyMs: 0, message: `Cannot connect to ${config.baseUrl}: ${err.message}` };
    }
  }

  public async generateCompletion(
    config: ProviderConfig,
    request: CompletionRequest
  ): Promise<CompletionResponse> {
    const startTime = performance.now();
    const baseUrl = config.baseUrl.replace(/\/+$/, '');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model || 'llama3',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
      }),
    });

    const latencyMs = Math.round(performance.now() - startTime);
    if (!res.ok) {
      throw new Error(`[Custom Provider Error] HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      provider: 'custom',
      model: config.model,
      latencyMs,
      tokensUsed: data.usage?.total_tokens,
    };
  }

  public async generateStream(
    config: ProviderConfig,
    request: CompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<CompletionResponse> {
    const res = await this.generateCompletion(config, request);
    onChunk(res.content);
    return res;
  }
}
