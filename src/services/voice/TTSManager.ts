import { AssistantLanguage } from '../../types';

export class TTSManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private onStateChange?: (speaking: boolean) => void;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public registerStateListener(cb: (speaking: boolean) => void): void {
    this.onStateChange = cb;
  }

  private loadVoices(): void {
    if (!this.synth) return;
    this.availableVoices = this.synth.getVoices();
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && this.synth) {
      this.availableVoices = this.synth.getVoices();
    }
    return this.availableVoices;
  }

  /**
   * Cleans text to be spoken naturally:
   * Removes markdown asterisks, block quotes, code blocks, URLs, JSON
   */
  public cleanTextForSpeech(rawText: string): string {
    if (!rawText) return '';
    let text = rawText;

    // 1. Remove markdown code blocks completely
    text = text.replace(/```[\s\S]*?```/g, ' [code block omitted] ');
    // 2. Remove inline code
    text = text.replace(/`([^`]+)`/g, '$1');
    // 3. Remove URLs
    text = text.replace(/https?:\/\/\S+/gi, '');
    // 4. Remove JSON objects or arrays
    text = text.replace(/\{[\s\S]*?\}/g, '');
    // 5. Remove markdown headers, bold, italics, strikethrough, lists
    text = text.replace(/[#*_~>]/g, '');
    // 6. Remove markdown links [title](url) -> title
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    // 7. Clean excessive whitespace and newlines
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Breaks text into manageable sentence chunks for lower latency and better cadence
   */
  public splitIntoSentences(text: string): string[] {
    const cleaned = this.cleanTextForSpeech(text);
    if (!cleaned) return [];
    // Split by sentence delimiters (. ! ? \n or Hindi poornaviram ।)
    const matches = cleaned.match(/[^.!?।\n]+[.!?।\n]+/g);
    if (!matches || matches.length === 0) {
      return [cleaned];
    }
    return matches.map((s) => s.trim()).filter(Boolean);
  }

  /**
   * Speaks the response with barge-in support and voice matching
   */
  public async speak(
    text: string,
    options: {
      speed?: number;
      pitch?: number;
      language?: AssistantLanguage;
      voiceName?: string;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): Promise<void> {
    if (!this.synth) {
      options.onEnd?.();
      return;
    }

    // Immediate barge-in: cancel any currently playing utterance
    this.stop();

    const cleaned = this.cleanTextForSpeech(text);
    if (!cleaned) {
      options.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleaned);
    this.currentUtterance = utterance;

    utterance.rate = options.speed ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    // Determine voice based on language and preferences
    const lang = options.language || 'en-US';
    const voices = this.getVoices();

    if (options.voiceName) {
      const chosen = voices.find((v) => v.name === options.voiceName);
      if (chosen) utterance.voice = chosen;
    }

    if (!utterance.voice && voices.length > 0) {
      if (lang === 'hi-IN') {
        const hindiVoice = voices.find(
          (v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
        );
        if (hindiVoice) utterance.voice = hindiVoice;
      } else if (lang === 'hinglish') {
        const indianVoice = voices.find(
          (v) => v.lang.includes('IN') || v.name.toLowerCase().includes('india')
        );
        if (indianVoice) utterance.voice = indianVoice;
      }
    }

    utterance.onstart = () => {
      this.isSpeakingState = true;
      this.onStateChange?.(true);
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.currentUtterance = null;
      this.onStateChange?.(false);
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeakingState = false;
      this.currentUtterance = null;
      this.onStateChange?.(false);
      // 'interrupted' or 'canceled' is normal during user interruption
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        options.onError?.(e);
      }
    };

    this.synth.speak(utterance);
  }

  /**
   * Barge-in: Stops playback immediately
   */
  public stop(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
    this.isSpeakingState = false;
    this.currentUtterance = null;
    this.onStateChange?.(false);
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState || (this.synth ? this.synth.speaking : false);
  }
}

export const ttsManager = new TTSManager();
