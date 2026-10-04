import { AssistantLanguage } from '../../types';

export interface STTCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class SpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private language: AssistantLanguage = 'en-US';
  private callbacks: STTCallbacks = {};

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onStart?.();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const activeText = finalTranscript || interimTranscript;
        if (activeText) {
          this.callbacks.onResult?.(activeText.trim(), Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: any) => {
        let msg = event.error || 'Speech recognition error';
        if (event.error === 'not-allowed') {
          msg = 'Microphone permission denied. Please allow microphone access.';
        } else if (event.error === 'no-speech') {
          return; // Ignore transient silence
        }
        this.callbacks.onError?.(msg);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.callbacks.onEnd?.();
      };
    }
  }

  public isSupported(): boolean {
    return Boolean(this.recognition);
  }

  public setLanguage(lang: AssistantLanguage): void {
    this.language = lang;
    if (this.recognition) {
      if (lang === 'hi-IN') {
        this.recognition.lang = 'hi-IN';
      } else if (lang === 'hinglish') {
        // Indian English recognizes Hinglish terms well
        this.recognition.lang = 'en-IN';
      } else {
        this.recognition.lang = 'en-US';
      }
    }
  }

  public start(callbacks: STTCallbacks): void {
    if (!this.recognition) {
      callbacks.onError?.('Speech recognition is not supported in this browser/device.');
      return;
    }
    this.callbacks = callbacks;
    this.setLanguage(this.language);

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e: any) {
      if (e.name !== 'InvalidStateError') {
        callbacks.onError?.(e.message || 'Could not start microphone');
      }
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  public abort(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.isListening = false;
    }
  }

  public getListeningState(): boolean {
    return this.isListening;
  }
}

export const speechRecognizer = new SpeechRecognizer();
