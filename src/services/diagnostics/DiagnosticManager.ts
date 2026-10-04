import { DiagnosticResult } from '../../types';
import { AppDatabase } from '../storage/database';
import { ModelRouter } from '../ai/ModelRouter';
import { ttsManager } from '../voice/TTSManager';
import { speechRecognizer } from '../voice/SpeechRecognizer';
import { getAccessToken } from '../auth/firebaseAuth';

export class DiagnosticManager {
  public static async runFullDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    const settings = AppDatabase.getSettings();

    // 1. Internet Check
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    results.push({
      subsystem: 'Internet & Connectivity',
      status: isOnline ? 'PASS' : 'ERROR',
      message: isOnline ? 'Internet connection active' : 'No network connection detected',
      details: navigator.userAgent.slice(0, 80),
      timestamp: Date.now(),
    });

    // 2. Primary AI API Check
    try {
      const pingRes = await ModelRouter.testProvider(settings.primaryProvider);
      results.push({
        subsystem: `AI Model Provider (${settings.primaryProvider.toUpperCase()})`,
        status: pingRes.success ? 'PASS' : 'WARNING',
        message: pingRes.message,
        details: `Latency: ${pingRes.latencyMs}ms | Model: ${settings.primaryProvider}`,
        timestamp: Date.now(),
      });
    } catch (e: any) {
      results.push({
        subsystem: `AI Model Provider (${settings.primaryProvider.toUpperCase()})`,
        status: 'ERROR',
        message: `Failed test: ${e.message}`,
        timestamp: Date.now(),
      });
    }

    // 3. STT Subsystem
    const sttSupported = speechRecognizer.isSupported();
    results.push({
      subsystem: 'Speech-to-Text (STT)',
      status: sttSupported ? 'PASS' : 'ERROR',
      message: sttSupported
        ? 'Web Speech Recognition API is supported & ready.'
        : 'Web Speech Recognition not supported in this browser.',
      timestamp: Date.now(),
    });

    // 4. TTS Subsystem
    const voices = ttsManager.getVoices();
    results.push({
      subsystem: 'Text-to-Speech (TTS)',
      status: voices.length > 0 ? 'PASS' : 'WARNING',
      message: voices.length > 0 ? `${voices.length} synthesized voices detected.` : 'No speech voices loaded yet.',
      details: `Language preset: ${settings.language}`,
      timestamp: Date.now(),
    });

    // 5. Microphone Permission Check
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'microphone' as any });
        results.push({
          subsystem: 'Microphone Permission',
          status: status.state === 'granted' ? 'PASS' : status.state === 'prompt' ? 'WARNING' : 'ERROR',
          message: `Microphone permission state: ${status.state}`,
          timestamp: Date.now(),
        });
      }
    } catch {
      results.push({
        subsystem: 'Microphone Permission',
        status: 'WARNING',
        message: 'Could not query microphone permission directly (requires user tap).',
        timestamp: Date.now(),
      });
    }

    // 6. Google Sheets OAuth Integration
    const sheetsToken = await getAccessToken();
    results.push({
      subsystem: 'Google Sheets OAuth Integration',
      status: sheetsToken ? 'PASS' : 'WARNING',
      message: sheetsToken
        ? 'Connected with valid Google Workspace OAuth token.'
        : 'Not signed in. Tap "Sign in with Google" to enable Sheets capabilities.',
      details: settings.activeSpreadsheetId ? `Active Sheet: ${settings.activeSpreadsheetId}` : 'No active sheet',
      timestamp: Date.now(),
    });

    // 7. Bluetooth & BLE
    const bleSupported = typeof navigator !== 'undefined' && Boolean((navigator as any).bluetooth);
    results.push({
      subsystem: 'Bluetooth & BLE Subsystem',
      status: bleSupported ? 'PASS' : 'WARNING',
      message: bleSupported ? 'Web Bluetooth API supported.' : 'Web Bluetooth API not available on this browser/OS.',
      timestamp: Date.now(),
    });

    // 8. Storage & Database
    try {
      localStorage.setItem('shreya_diag_probe', 'ok');
      localStorage.removeItem('shreya_diag_probe');
      const convCount = AppDatabase.getConversations().length;
      results.push({
        subsystem: 'Local Storage & Database',
        status: 'PASS',
        message: `Database operational. Stored conversations: ${convCount}`,
        timestamp: Date.now(),
      });
    } catch (e: any) {
      results.push({
        subsystem: 'Local Storage & Database',
        status: 'ERROR',
        message: `Storage failure: ${e.message}`,
        timestamp: Date.now(),
      });
    }

    AppDatabase.saveDiagnosticLogs(results);
    return results;
  }
}
