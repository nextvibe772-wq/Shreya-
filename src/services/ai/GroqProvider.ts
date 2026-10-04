import { AIProvider, CompletionRequest, CompletionResponse } from './AIProvider';
import { ProviderConfig } from '../../types';

export class GroqProvider implements AIProvider {
  public readonly id = 'groq';
  public readonly name = 'Groq Cloud';

  public async testConnection(
    config: ProviderConfig
  ): Promise<{ success: boolean; latencyMs: number; message: string }> {
    if (!config.apiKey || !config.apiKey.trim()) {
      return { success: false, latencyMs: 0, message: 'Groq API Key is missing. Please provide a key.' };
    }

    const startTime = performance.now();
    try {
      const baseUrl = config.baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (res.status === 401) {
        return { success: false, latencyMs, message: 'Invalid Groq API key (401 Unauthorized).' };
      }
      if (res.status === 429) {
        return { success: false, latencyMs, message: 'Groq Rate Limit reached (429).' };
      }
      if (!res.ok) {
        const text = await res.text();
        return { success: false, latencyMs, message: `Groq error (${res.status}): ${text.slice(0, 100)}` };
      }

      return {
        success: true,
        latencyMs,
        message: `Connected successfully to Groq in ${latencyMs}ms!`,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        latencyMs,
        message: `Network/CORS error: ${err.message || 'Could not connect to Groq endpoint.'}`,
      };
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
        model: config.model || 'llama-3.3-70b-versatile',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
        stream: false,
      }),
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      const errMsg = errorJson?.error?.message || `Groq HTTP ${res.status}: ${res.statusText}`;
      throw new Error(`[Groq Error] ${errMsg}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens;

    return {
      content,
      provider: 'groq',
      model: config.model,
      latencyMs,
      tokensUsed,
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
        model: config.model || 'llama-3.3-70b-versatile',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
        stream: true,
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      const errMsg = errorJson?.error?.message || `Groq stream error: ${res.statusText}`;
      throw new Error(`[Groq Stream Error] ${errMsg}`);
    }

    if (!res.body) {
      throw new Error('No readable stream available in Groq response.');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
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
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              accumulated += delta;
              onChunk(delta);
            }
          } catch {
            // Ignore incomplete chunk parsing
          }
        }
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      content: accumulated,
      provider: 'groq',
      model: config.model,
      latencyMs,
    };
  }
}
