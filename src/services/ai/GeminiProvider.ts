import { AIProvider, CompletionRequest, CompletionResponse } from './AIProvider';
import { ProviderConfig } from '../../types';

export class GeminiProvider implements AIProvider {
  public readonly id = 'gemini';
  public readonly name = 'Google Gemini';

  private resolveKey(config: ProviderConfig): string {
    if (config.apiKey && config.apiKey.trim()) {
      return config.apiKey.trim();
    }
    // Fallback to environment variable if provided by AI Studio
    return (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).__GEMINI_KEY__ || '';
  }

  public async testConnection(
    config: ProviderConfig
  ): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const key = this.resolveKey(config);
    if (!key) {
      return { success: false, latencyMs: 0, message: 'Gemini API Key is missing. Please enter your key in Settings.' };
    }

    const startTime = performance.now();
    try {
      const model = config.model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${key}`;
      const res = await fetch(url);
      const latencyMs = Math.round(performance.now() - startTime);

      if (res.status === 400 || res.status === 403) {
        return { success: false, latencyMs, message: 'Invalid Gemini API key or unauthorized.' };
      }
      if (res.status === 429) {
        return { success: false, latencyMs, message: 'Gemini quota exceeded / rate limited (429).' };
      }
      if (!res.ok) {
        return { success: false, latencyMs, message: `Gemini HTTP ${res.status}: ${res.statusText}` };
      }

      return {
        success: true,
        latencyMs,
        message: `Connected successfully to Gemini (${model}) in ${latencyMs}ms!`,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return { success: false, latencyMs, message: `Network error: ${err.message}` };
    }
  }

  public async generateCompletion(
    config: ProviderConfig,
    request: CompletionRequest
  ): Promise<CompletionResponse> {
    const key = this.resolveKey(config);
    if (!key) throw new Error('Gemini API key is required. Please add it in Settings.');

    const startTime = performance.now();
    const model = config.model || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const contents = this.formatMessages(request.messages);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2048,
        },
      }),
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(`[Gemini Error] ${err?.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = data.usageMetadata?.totalTokenCount;

    return {
      content,
      provider: 'gemini',
      model,
      latencyMs,
      tokensUsed,
    };
  }

  public async generateStream(
    config: ProviderConfig,
    request: CompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<CompletionResponse> {
    const key = this.resolveKey(config);
    if (!key) throw new Error('Gemini API key is required.');

    const startTime = performance.now();
    const model = config.model || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;

    const contents = this.formatMessages(request.messages);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2048,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(`[Gemini Stream Error] ${err?.error?.message || res.statusText}`);
    }

    if (!res.body) {
      throw new Error('Gemini response body is not readable');
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
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const part = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (part) {
              accumulated += part;
              onChunk(part);
            }
          } catch {
            // chunk boundary
          }
        }
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      content: accumulated,
      provider: 'gemini',
      model,
      latencyMs,
    };
  }

  private formatMessages(messages: { role: string; content: string }[]) {
    return messages.map((m) => {
      let role = 'user';
      if (m.role === 'assistant') role = 'model';
      else if (m.role === 'system') role = 'user';
      return {
        role,
        parts: [{ text: m.content }],
      };
    });
  }
}
