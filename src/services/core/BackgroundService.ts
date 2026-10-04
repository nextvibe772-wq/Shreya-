import { AppDatabase } from '../storage/database';
import { wakeWordManager } from '../voice/WakeWordManager';

export interface BackgroundServiceState {
  isActive: boolean;
  isMicPaused: boolean;
  wakeLockAcquired: boolean;
  notificationShown: boolean;
  lastHeartbeat: number;
}

export class BackgroundAssistantService {
  private static instance: BackgroundAssistantService;
  private state: BackgroundServiceState = {
    isActive: false,
    isMicPaused: false,
    wakeLockAcquired: false,
    notificationShown: false,
    lastHeartbeat: Date.now(),
  };

  private wakeLockSentinel: any = null;
  private heartbeatInterval: any = null;
  private listeners = new Set<(state: BackgroundServiceState) => void>();

  public static getInstance(): BackgroundAssistantService {
    if (!this.instance) {
      this.instance = new BackgroundAssistantService();
    }
    return this.instance;
  }

  public getState(): BackgroundServiceState {
    return { ...this.state };
  }

  public subscribe(listener: (state: BackgroundServiceState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  public async startService(onWakeWordTrigger?: (phrase: string) => void): Promise<boolean> {
    this.state.isActive = true;
    this.state.isMicPaused = false;
    this.state.lastHeartbeat = Date.now();

    // 1. Request Screen Wake Lock (Android foreground behavior emulation)
    if ('wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.state.wakeLockAcquired = true;
      } catch (err) {
        console.warn('[BackgroundService] Wake lock request failed:', err);
      }
    }

    // 2. Request Notifications API for persistent notification bar
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('SHREYA Voice Assistant Active', {
          body: '🟢 SHREYA is running in background. Tap to interact or say "Hey Shreya".',
          icon: '/favicon.ico',
          tag: 'shreya-bg-service',
          silent: true,
        });
        this.state.notificationShown = true;
      } catch {}
    }

    // 3. Start Wake Word continuous detection loop if enabled
    const settings = AppDatabase.getSettings();
    if (settings.wakeWordEnabled && onWakeWordTrigger) {
      wakeWordManager.start({
        onWakeWordDetected: (phrase) => {
          if (!this.state.isMicPaused) {
            onWakeWordTrigger(phrase);
          }
        },
      });
    }

    // 4. Heartbeat keep-alive timer
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.state.lastHeartbeat = Date.now();
      this.notify();
    }, 5000);

    AppDatabase.saveSettings({ ...settings, backgroundAssistantEnabled: true });
    this.notify();
    return true;
  }

  public stopService(): void {
    this.state.isActive = false;
    this.state.isMicPaused = false;

    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {}
      this.wakeLockSentinel = null;
      this.state.wakeLockAcquired = false;
    }

    wakeWordManager.stop();
    clearInterval(this.heartbeatInterval);

    const settings = AppDatabase.getSettings();
    AppDatabase.saveSettings({ ...settings, backgroundAssistantEnabled: false });
    this.notify();
  }

  public pauseMic(): void {
    this.state.isMicPaused = true;
    wakeWordManager.stop();
    this.notify();
  }

  public resumeMic(onWakeWordTrigger?: (phrase: string) => void): void {
    this.state.isMicPaused = false;
    if (onWakeWordTrigger) {
      wakeWordManager.start({
        onWakeWordDetected: onWakeWordTrigger,
      });
    }
    this.notify();
  }
}

export const backgroundService = BackgroundAssistantService.getInstance();
