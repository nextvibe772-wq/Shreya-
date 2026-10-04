import { AppDatabase } from '../storage/database';
import { ModelRouter } from '../ai/ModelRouter';
import { CommandClassifier, ClassifiedCommand } from '../nlu/CommandClassifier';
import { SkillRouter } from '../skills/SkillRouter';
import { MemoryManager } from './MemoryManager';
import { ttsManager } from '../voice/TTSManager';
import { MediaSkill } from '../skills/MediaSkill';
import { ChatMessage, AssistantVoiceState, ShreyaSettings } from '../../types';

export interface ProcessCallbacks {
  onStateChange?: (state: AssistantVoiceState) => void;
  onPartialResponse?: (chunk: string) => void;
  onSkillExecuted?: (result: any) => void;
  onMessageGenerated?: (message: ChatMessage) => void;
}

export class ShreyaCore {
  private static instance: ShreyaCore;

  public static getInstance(): ShreyaCore {
    if (!this.instance) {
      this.instance = new ShreyaCore();
      SkillRouter.initialize();
    }
    return this.instance;
  }

  /**
   * Builds the adaptive system prompt based on user settings, personality, language, and recalled memories
   */
  private buildSystemPrompt(settings: ShreyaSettings): string {
    const memoryContext = MemoryManager.getContextSummary();

    let languageDirective = '';
    if (settings.language === 'hi-IN') {
      languageDirective =
        'You must converse fluently in Hindi (Devanagari script) with a natural, respectful, and friendly Indian voice tone.';
    } else if (settings.language === 'hinglish') {
      languageDirective =
        'You must converse in natural urban Indian Hinglish (mixture of conversational Hindi written in Roman English alphabet with natural Hindi expressions like "Haanji", "Zaroor", "Bilkul", "Aapka kaam ho gaya"). Keep it warm, expressive, and conversational.';
    } else {
      languageDirective =
        'Converse in modern, polished, natural conversational English with exceptional clarity and emotional intelligence.';
    }

    let personalityDirective = '';
    switch (settings.personality) {
      case 'concise':
        personalityDirective = 'Be extremely concise, direct, and action-oriented. No fluff.';
        break;
      case 'analytical':
        personalityDirective = 'Provide structured, data-informed, and analytical breakdowns.';
        break;
      case 'creative':
        personalityDirective = 'Be creative, witty, and engaging with lively analogies.';
        break;
      case 'friendly':
      default:
        personalityDirective =
          'Be warm, helpful, intelligent, polite, and confident like a world-class personal AI companion.';
        break;
    }

    const activeSheetInfo = settings.activeSpreadsheetId
      ? `Active Google Sheet: "${settings.activeSpreadsheetTitle || 'Default'}" (ID: ${settings.activeSpreadsheetId})`
      : 'No active Google Sheet selected yet.';

    return `You are SHREYA (Smart High-speed Responsive Everyday Yield Assistant), an ultra-capable personal AI voice assistant.

### CORE DIRECTIVES:
1. IDENTITY: You are SHREYA. You are capable, intelligent, proactive, and secure.
2. USER: Speaking with ${settings.userName || 'the user'}.
3. TONE & PERSONALITY: ${personalityDirective}
4. LANGUAGE DIRECTIVE: ${languageDirective}
5. GOOGLE SHEETS INTEGRATION: You have direct Google Sheets integration. If the user asks to create a sheet, log activity, read cells, or append rows, acknowledge that you are executing it.
6. HARDWARE & SKILLS: You are connected to phone apps, web search, ESP32/Raspberry Pi smart home nodes, PC companion workstation, Bluetooth BLE devices, and task management.
7. VOICE OPTIMIZATION: Keep verbal answers clear, punchy, and natural. Avoid outputting raw JSON, complex markdown tables, or unnecessary symbols in spoken answers.
8. SHEETS STATE: ${activeSheetInfo}

${memoryContext}
`;
  }

  /**
   * Main pipeline: Takes input text from Voice STT or Chat Text, runs NLU, executes skills, calls ModelRouter, updates memory, and triggers TTS
   */
  public async processInput(
    input: string,
    conversationId: string,
    callbacks: ProcessCallbacks = {}
  ): Promise<ChatMessage> {
    const settings = AppDatabase.getSettings();
    callbacks.onStateChange?.('processing');

    // 1. Play listening/processing sound chime if enabled
    if (settings.enableSoundEffects) {
      MediaSkill.playChime('listening');
    }

    // 2. Classify intent via CommandUnderstandingManager
    const classification: ClassifiedCommand = CommandClassifier.classify(input);
    console.log('[ShreyaCore] Classified input:', classification);

    // 3. Save User message to Database
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_user',
      conversationId,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    AppDatabase.addMessage(conversationId, userMsg);

    // 4. Check if a Skill should be routed first (Google Sheets, App launcher, Search, Smart Home, PC, Task)
    let skillExecutionResult: any = null;
    if (classification.intent !== 'CHAT') {
      try {
        skillExecutionResult = await SkillRouter.route(
          classification.intent,
          classification.extractedParams
        );
        if (skillExecutionResult) {
          callbacks.onSkillExecuted?.(skillExecutionResult);
        }
      } catch (skillErr) {
        console.warn('[ShreyaCore] Skill routing error:', skillErr);
      }
    }

    // 5. Build conversation history & inject skill context into AI prompt
    const recentMessages = AppDatabase.getMessages(conversationId).slice(-8);
    const systemPrompt = this.buildSystemPrompt(settings);

    let enrichedUserPrompt = input;
    if (skillExecutionResult) {
      enrichedUserPrompt += `\n\n[SYSTEM SKILL EXECUTION RESULT]: ${skillExecutionResult.summary}`;
      if (skillExecutionResult.data) {
        enrichedUserPrompt += `\n[DATA]: ${JSON.stringify(skillExecutionResult.data).slice(0, 500)}`;
      }
    }

    const promptMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...recentMessages.slice(0, -1).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: enrichedUserPrompt },
    ];

    // 6. Execute AI Model via ModelRouter
    let fullResponse = '';
    let finalProvider = settings.primaryProvider;
    let finalModel = '';

    try {
      const response = await ModelRouter.execute(
        {
          messages: promptMessages,
          temperature: 0.7,
        },
        {
          stream: true,
          onChunk: (chunk) => {
            fullResponse += chunk;
            callbacks.onPartialResponse?.(chunk);
          },
        }
      );

      fullResponse = response.content;
      finalProvider = response.provider;
      finalModel = response.model;
    } catch (err: any) {
      console.error('[ShreyaCore] ModelRouter execution error:', err);
      // Fallback friendly message if offline or no keys configured
      if (skillExecutionResult?.summary) {
        fullResponse = skillExecutionResult.summary;
      } else {
        fullResponse = `I'm having trouble reaching the AI model provider (${err.message || 'Connection error'}). You can add or verify your API keys in Settings.`;
      }
    }

    // 7. Save Assistant message to Database
    const assistantMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_assistant',
      conversationId,
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now(),
      provider: finalProvider,
      model: finalModel,
      skillExecuted: skillExecutionResult
        ? {
            id: classification.intent,
            name: classification.intent,
            summary: skillExecutionResult.summary,
            data: skillExecutionResult.data,
            error: skillExecutionResult.error,
          }
        : undefined,
    };
    AppDatabase.addMessage(conversationId, assistantMsg);
    callbacks.onMessageGenerated?.(assistantMsg);

    // 8. Auto-speak response if enabled
    if (settings.autoSpeak && fullResponse) {
      callbacks.onStateChange?.('speaking');
      await ttsManager.speak(fullResponse, {
        speed: settings.voiceSpeed,
        pitch: settings.voicePitch,
        language: settings.language,
        voiceName: settings.voiceName,
        onEnd: () => {
          callbacks.onStateChange?.('idle');
          if (settings.continuousConversation) {
            // Trigger auto-listen in continuous conversation mode
          }
        },
        onError: () => {
          callbacks.onStateChange?.('idle');
        },
      });
    } else {
      callbacks.onStateChange?.('idle');
    }

    return assistantMsg;
  }
}

export const shreyaCore = ShreyaCore.getInstance();
