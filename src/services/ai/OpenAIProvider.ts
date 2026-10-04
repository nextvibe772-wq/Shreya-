import { AIProvider, CompletionRequest, CompletionResponse } from './AIProvider';
import { ProviderConfig } from '../../types';

export class OpenAIProvider implements AIProvider {
  public readonly id = 'openai';
  public readonly name = 'OpenAI';

  public async testConnection(
    config: ProviderConfig
  ): Promise<{ success: boolean; latencyMs: number; message: string }> {
    if (!config.apiKey || !config.apiKey.trim()) {
      return { success: false, latencyMs: 0, message: 'OpenAI API Key is missing.' };
    }

    const startTime = performance.now();
    try {
      const baseUrl = config.baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${config.apiKey.trim()}` },
      });
      const latencyMs = Math.round(performance.now() - startTime);

      if (res.status === 401) {
        return { success: false, latencyMs, message: 'Invalid OpenAI API key.' };
      }
      if (res.status === 429) {
        return { success: false, latencyMs, message: 'OpenAI rate limit or insufficient quota.' };
      }
      if (!res.ok) {
        return { success: false, latencyMs, message: `OpenAI error: HTTP ${res.status}` };
      }

      return { success: true, latencyMs, message: `Connected to OpenAI in ${latencyMs}ms!` };
    } catch (err: any) {
      return { success: false, latencyMs: 0, message: `Connection error: ${err.message}` };
    }
  }

  public async generateCompletion(
    config: ProviderConfig,
    request: CompletionRequest
  ): Promise<CompletionResponse> {
    const startTime = performance.now();
    const baseUrl = config.baseUrl.replace(/\/+$/, '');

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
      }),
    });

    const latencyMs = Math.round(performance.now() - startTime);
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(`[OpenAI Error] ${err?.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      provider: 'openai',
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
    const startTime = performance.now();
    const baseUrl = config.baseUrl.replace(/\/+$/, '');

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
        stream: true,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(`[OpenAI Stream Error] ${err?.error?.message || res.statusText}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              accumulated += delta;
              onChunk(delta);
            }
          } catch {}
        }
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);
    return { content: accumulated, provider: 'openai', model: config.model, latencyMs };
  }
}
