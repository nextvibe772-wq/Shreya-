import { AssistantSkill, SkillResult } from './SkillInterface';

export class MediaSkill implements AssistantSkill {
  public readonly id = 'media_skill';
  public readonly name = 'Media & Audio Controller';
  public readonly description = 'Controls media playback, background sounds, volume, and Media Session metadata.';
  public readonly permissions = ['AUDIO_OUTPUT'];
  public readonly requiresConfirmation = false;

  private static audioCtx: AudioContext | null = null;

  public static playChime(type: 'success' | 'alert' | 'listening'): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;
      if (type === 'listening') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
      } else {
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
      }

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  public async execute(params: Record<string, any>): Promise<SkillResult> {
    const action = params.action || 'play';

    if (action === 'chime') {
      MediaSkill.playChime('success');
      return { success: true, summary: 'Sound chime played.' };
    }

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      if (action === 'pause') {
        navigator.mediaSession.playbackState = 'paused';
        return { success: true, summary: 'Media paused.' };
      } else {
        navigator.mediaSession.playbackState = 'playing';
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'SHREYA Voice Assistant',
          artist: 'SHREYA Personal AI',
          album: 'Foreground Audio Session',
        });
        return { success: true, summary: 'Media playback resumed.' };
      }
    }

    return {
      success: true,
      summary: `Media action "${action}" completed.`,
    };
  }
}
