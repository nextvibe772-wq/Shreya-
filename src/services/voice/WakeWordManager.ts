export interface WakeWordCallbacks {
  onWakeWordDetected: (phrase: string) => void;
  onListeningStatusChange?: (isListening: boolean) => void;
  onError?: (error: string) => void;
}

export class WakeWordManager {
  private isListening = false;
  private wakePhrase = 'hey shreya';
  private sensitivity = 7; // 1 to 10
  private recognition: any = null;
  private callbacks?: WakeWordCallbacks;
  private restartTimeout: any = null;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          if (this.matchesWakePhrase(transcript)) {
            console.log('[WakeWord] Wake phrase triggered:', transcript);
            this.callbacks?.onWakeWordDetected(transcript);
            break;
          }
        }
      };

      this.recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('[WakeWord] Recognizer error:', e.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Restart loop for persistent wake-word listener
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.isListening) {
              try {
                this.recognition.start();
              } catch {}
            }
          }, 400);
        }
      };
    }
  }

  public setConfig(phrase: string, sensitivity: number): void {
    this.wakePhrase = phrase.toLowerCase().trim();
    this.sensitivity = sensitivity;
  }

  private matchesWakePhrase(transcript: string): boolean {
    const cleaned = transcript.replace(/[^\w\s]/gi, '').toLowerCase();
    const target = this.wakePhrase.replace(/[^\w\s]/gi, '').toLowerCase();

    // Direct match
    if (cleaned.includes(target)) return true;

    // Fuzzy phonetic matches for "Hey Shreya" / "Shreya"
    const variations = [
      'hey shreya',
      'he shreya',
      'hai shreya',
      'hi shreya',
      'shreya',
      'shreya suno',
      'hey shria',
      'shreeya',
    ];

    return variations.some((variant) => cleaned.includes(variant));
  }

  public start(callbacks: WakeWordCallbacks): void {
    if (!this.recognition) {
      callbacks.onError?.('Wake-word engine not supported in this browser.');
      return;
    }
    this.callbacks = callbacks;
    this.isListening = true;
    callbacks.onListeningStatusChange?.(true);

    try {
      this.recognition.start();
    } catch (e: any) {
      if (e.name !== 'InvalidStateError') {
        console.warn('Wake word start note:', e.message);
      }
    }
  }

  public stop(): void {
    this.isListening = false;
    clearTimeout(this.restartTimeout);
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
    }
    this.callbacks?.onListeningStatusChange?.(false);
  }

  public getStatus(): { isListening: boolean; wakePhrase: string; sensitivity: number } {
    return {
      isListening: this.isListening,
      wakePhrase: this.wakePhrase,
      sensitivity: this.sensitivity,
    };
  }
}

export const wakeWordManager = new WakeWordManager();
