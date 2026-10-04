import { AIProvider, CompletionRequest, CompletionResponse } from './AIProvider';
import { GroqProvider } from './GroqProvider';
import { GeminiProvider } from './GeminiProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { ClaudeProvider } from './ClaudeProvider';
import { CustomProvider } from './CustomProvider';
import { AppDatabase } from '../storage/database';
import { AIProviderId, ProviderConfig } from '../../types';

export interface RouteOptions {
  overrideProviderId?: AIProviderId;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
}

export class ModelRouter {
  private static providers: Map<AIProviderId, AIProvider> = new Map<AIProviderId, AIProvider>([
    ['groq', new GroqProvider()],
    ['gemini', new GeminiProvider()],
    ['openai', new OpenAIProvider()],
    ['claude', new ClaudeProvider()],
    ['custom', new CustomProvider()],
  ]);

  public static getProviderInstance(id: AIProviderId): AIProvider | undefined {
    return this.providers.get(id);
  }

  public static async testProvider(id: AIProviderId): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const provider = this.providers.get(id);
    if (!provider) {
      return { success: false, latencyMs: 0, message: `Unknown provider ${id}` };
    }
    const allConfigs = AppDatabase.getProviders();
    const config = allConfigs.find((c) => c.id === id);
    if (!config) {
      return { success: false, latencyMs: 0, message: `Configuration not found for ${id}` };
    }

    const result = await provider.testConnection(config);
    // Update status in database
    config.status = result.success ? 'connected' : 'error';
    config.latencyMs = result.latencyMs;
    config.lastTested = Date.now();
    AppDatabase.updateProvider(config);
    return result;
  }

  public static async execute(
    request: CompletionRequest,
    options: RouteOptions = {}
  ): Promise<CompletionResponse> {
    const settings = AppDatabase.getSettings();
    const configs = AppDatabase.getProviders();

    const primaryId = options.overrideProviderId || settings.primaryProvider || 'groq';
    const fallbackId = settings.fallbackProvider || 'gemini';
    const fallbackEnabled = settings.fallbackEnabled && primaryId !== fallbackId;

    // 1. Try Primary Provider
    const primaryConfig = configs.find((c) => c.id === primaryId);
    const primaryInstance = this.providers.get(primaryId);

    if (primaryInstance && primaryConfig) {
      try {
        if (options.stream && options.onChunk) {
          return await primaryInstance.generateStream(primaryConfig, request, options.onChunk);
        } else {
          return await primaryInstance.generateCompletion(primaryConfig, request);
        }
      } catch (primaryErr: any) {
        console.warn(`[ModelRouter] Primary provider (${primaryId}) failed:`, primaryErr);

        if (!fallbackEnabled) {
          throw primaryErr;
        }

        console.info(`[ModelRouter] Attempting automatic fallback to ${fallbackId}...`);
      }
    }

    // 2. Try Fallback Provider
    const fallbackConfig = configs.find((c) => c.id === fallbackId);
    const fallbackInstance = this.providers.get(fallbackId);

    if (fallbackInstance && fallbackConfig) {
      try {
        if (options.stream && options.onChunk) {
          return await fallbackInstance.generateStream(fallbackConfig, request, options.onChunk);
        } else {
          return await fallbackInstance.generateCompletion(fallbackConfig, request);
        }
      } catch (fallbackErr: any) {
        console.error(`[ModelRouter] Fallback provider (${fallbackId}) also failed:`, fallbackErr);
        throw new Error(
          `Primary provider (${primaryId}) and fallback provider (${fallbackId}) both failed. Error: ${fallbackErr.message}`
        );
      }
    }

    throw new Error('No functional AI Provider is configured or enabled.');
  }
}
