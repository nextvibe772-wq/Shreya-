import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Trash2,
  Activity,
  Cpu,
  Volume2,
  Mic,
} from 'lucide-react';
import { DiagnosticResult, ProviderConfig } from '../../types';
import { AppDatabase } from '../../services/storage/database';
import { DiagnosticManager } from '../../services/diagnostics/DiagnosticManager';
import { ModelRouter } from '../../services/ai/ModelRouter';
import { ttsManager } from '../../services/voice/TTSManager';
import { speechRecognizer } from '../../services/voice/SpeechRecognizer';
import { MediaSkill } from '../../services/skills/MediaSkill';

export const DeveloperConsole: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);
  const settings = AppDatabase.getSettings();
  const providers = AppDatabase.getProviders();
  const activeProvider = providers.find((p) => p.id === settings.primaryProvider);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const results = await DiagnosticManager.runFullDiagnostics();
      setDiagnostics(results);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  const logTest = (msg: string) => {
    setTestLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 40)]);
  };

  const handleTestSTT = () => {
    logTest('Testing Web Speech STT recognizer...');
    speechRecognizer.start({
      onStart: () => logTest('STT start event received. Please say something...'),
      onResult: (t) => logTest(`STT transcript recognized: "${t}"`),
      onError: (err) => logTest(`STT Error: ${err}`),
      onEnd: () => logTest('STT session ended.'),
    });
    setTimeout(() => speechRecognizer.stop(), 5000);
  };

  const handleTestTTS = () => {
    logTest('Testing Text-to-Speech synthesis with sentence chunking...');
    ttsManager.speak('Hello! SHREYA diagnostic voice subsystem operational.', {
      speed: 1.0,
      onEnd: () => logTest('TTS test completed successfully.'),
      onError: (e) => logTest(`TTS test error: ${e}`),
    });
  };

  const handleTestChime = () => {
    MediaSkill.playChime('success');
    logTest('Synthesized Web Audio API frequency chime test.');
  };

  const handleTestAI = async () => {
    logTest(`Pinging Primary AI Provider (${settings.primaryProvider})...`);
    try {
      const res = await ModelRouter.execute({
        messages: [{ role: 'user', content: 'Reply with the single word "SHREYA_HEALTHY"' }],
      });
      logTest(`AI Response received in ${res.latencyMs}ms: "${res.content.trim()}"`);
    } catch (e: any) {
      logTest(`AI Test failed: ${e.message}`);
    }
  };

  const exportDiagnosticsReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      platform: navigator.userAgent,
      settings,
      diagnostics,
      logs: testLog,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `shreya_diagnostics_${Date.now()}.json`;
    a.click();
    a.remove();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase font-mono">
            <Terminal className="w-4 h-4" />
            <span>Developer & Diagnostics Console</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-neutral-100 mt-1">
            System Diagnostics
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl mt-1">
            Real-time telemetry, provider health status, latency benchmarks, and manual subsystem triggers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Re-Run All Tests'}</span>
          </button>
          <button
            onClick={exportDiagnosticsReport}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors cursor-pointer"
            title="Export Diagnostics Report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Status Card Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 space-y-1">
          <span className="text-[10px] font-mono text-neutral-500 uppercase">Primary Engine</span>
          <p className="text-sm font-bold text-cyan-400 capitalize">{settings.primaryProvider}</p>
          <p className="text-[10px] text-neutral-400 font-mono truncate">{activeProvider?.model}</p>
        </div>

        <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 space-y-1">
          <span className="text-[10px] font-mono text-neutral-500 uppercase">Engine Status</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                activeProvider?.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <p className="text-sm font-bold text-neutral-200 capitalize">
              {activeProvider?.status || 'Ready'}
            </p>
          </div>
          <p className="text-[10px] text-neutral-400 font-mono">
            {activeProvider?.latencyMs ? `${activeProvider.latencyMs}ms latency` : 'Standby'}
          </p>
        </div>

        <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 space-y-1">
          <span className="text-[10px] font-mono text-neutral-500 uppercase">Language Locale</span>
          <p className="text-sm font-bold text-indigo-400">{settings.language}</p>
          <p className="text-[10px] text-neutral-400">Tone: {settings.personality}</p>
        </div>

        <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 space-y-1">
          <span className="text-[10px] font-mono text-neutral-500 uppercase">Background Service</span>
          <p className="text-sm font-bold text-emerald-400">
            {settings.backgroundAssistantEnabled ? 'Active' : 'Disabled'}
          </p>
          <p className="text-[10px] text-neutral-400">Wake word: {settings.wakeWordPhrase}</p>
        </div>
      </div>

      {/* Diagnostics Subsystem Checklist */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Subsystem Diagnostics Report
        </h2>

        <div className="space-y-2">
          {diagnostics.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                {item.status === 'PASS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : item.status === 'WARNING' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-neutral-200">{item.subsystem}</div>
                  <div className="text-[11px] text-neutral-400">{item.message}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.details && (
                  <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
                    {item.details}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    item.status === 'PASS'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : item.status === 'WARNING'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Diagnostic Action Triggers */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
          <Play className="w-4 h-4 text-emerald-400" />
          Interactive Subsystem Probes
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={handleTestAI}
            className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-semibold text-cyan-300 flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Cpu className="w-4 h-4" />
            <span>Test AI Ping</span>
          </button>
          <button
            onClick={handleTestTTS}
            className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-semibold text-emerald-300 flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Test TTS Voice</span>
          </button>
          <button
            onClick={handleTestSTT}
            className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-semibold text-purple-300 flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Test STT Mic</span>
          </button>
          <button
            onClick={handleTestChime}
            className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-semibold text-amber-300 flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Audio Chime</span>
          </button>
        </div>

        {/* Live Test Console Log Window */}
        <div className="mt-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-[11px] text-neutral-300 h-32 overflow-y-auto space-y-1">
          {testLog.length === 0 ? (
            <span className="text-neutral-600">// Ready. Tap any probe button above to test.</span>
          ) : (
            testLog.map((line, idx) => <div key={idx}>{line}</div>)
          )}
        </div>
      </div>
    </div>
  );
};
