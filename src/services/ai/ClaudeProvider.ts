import { AIProvider, CompletionRequest, CompletionResponse } from './AIProvider';
import { ProviderConfig } from '../../types';

export class ClaudeProvider implements AIProvider {
  public readonly id = 'claude';
  public readonly name = 'Anthropic Claude';

  public async testConnection(
    config: ProviderConfig
  ): Promise<{ success: boolean; latencyMs: number; message: string }> {
    if (!config.apiKey || !config.apiKey.trim()) {
      return { success: false, latencyMs: 0, message: 'Anthropic API Key is missing.' };
    }

    const startTime = performance.now();
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'dangerously-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Ping' }],
        }),
      });

      const latencyMs = Math.round(performance.now() - startTime);
      if (res.status === 401) return { success: false, latencyMs, message: 'Invalid Anthropic API Key.' };
      if (!res.ok) return { success: false, latencyMs, message: `Anthropic HTTP ${res.status}` };
      return { success: true, latencyMs, message: `Connected to Claude in ${latencyMs}ms!` };
    } catch (err: any) {
      return { success: false, latencyMs: 0, message: `CORS / Network Error: ${err.message}` };
    }
  }

  public async generateCompletion(
    config: ProviderConfig,
    request: CompletionRequest
  ): Promise<CompletionResponse> {
    const startTime = performance.now();
    const systemMsg = request.messages.find((m) => m.role === 'system')?.content;
    const userAndAssistant = request.messages.filter((m) => m.role !== 'system');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'dangerously-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: request.maxTokens || 2048,
        system: systemMsg,
        messages: userAndAssistant,
      }),
    });

    const latencyMs = Math.round(performance.now() - startTime);
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(`[Claude Error] ${err?.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const content = data.content?.[0]?.text || '';
    return {
      content,
      provider: 'claude',
      model: config.model,
      latencyMs,
      tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    };
  }

  public async generateStream(
    config: ProviderConfig,
    request: CompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<CompletionResponse> {
    // Fallback to completion for browser environments if streaming SSE is blocked by Anthropic CORS
    const result = await this.generateCompletion(config, request);
    onChunk(result.content);
    return result;
  }
}
