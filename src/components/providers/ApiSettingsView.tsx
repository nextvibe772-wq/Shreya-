import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  Key,
  Globe,
  Radio,
  Eye,
  EyeOff,
  Zap,
  RefreshCw,
  Server,
  Star,
  Check,
} from 'lucide-react';
import { ProviderConfig, AIProviderId } from '../../types';
import { AppDatabase } from '../../services/storage/database';
import { ModelRouter } from '../../services/ai/ModelRouter';
import { SecurityManager } from '../../services/security/securityManager';

interface ApiSettingsViewProps {
  onProviderUpdated?: () => void;
}

export const ApiSettingsView: React.FC<ApiSettingsViewProps> = ({ onProviderUpdated }) => {
  const [providers, setProviders] = useState<ProviderConfig[]>(() => AppDatabase.getProviders());
  const [settings, setSettings] = useState(() => AppDatabase.getSettings());
  const [selectedProviderId, setSelectedProviderId] = useState<AIProviderId>('groq');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; latency?: number }>>({});
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const activeProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  const handleUpdateActiveField = (field: keyof ProviderConfig, value: any) => {
    const updated = providers.map((p) => {
      if (p.id === activeProvider.id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setProviders(updated);
  };

  const handleSave = () => {
    AppDatabase.saveProviders(providers);
    setStatusBanner(`Saved settings for ${activeProvider.name}!`);
    setTimeout(() => setStatusBanner(null), 3000);
    onProviderUpdated?.();
  };

  const handleTestConnection = async (id: AIProviderId) => {
    setTestingId(id);
    // Make sure latest unsaved key is temporarily persisted in memory/storage for test
    AppDatabase.saveProviders(providers);
    try {
      const res = await ModelRouter.testProvider(id);
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          success: res.success,
          message: res.message,
          latency: res.latencyMs,
        },
      }));
      // Refresh providers state from DB to pick up updated status & latency
      setProviders(AppDatabase.getProviders());
      onProviderUpdated?.();
    } catch (e: any) {
      setTestResults((prev) => ({
        ...prev,
        [id]: { success: false, message: e.message },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleSetPrimary = (id: AIProviderId) => {
    const newSettings = { ...settings, primaryProvider: id };
    setSettings(newSettings);
    AppDatabase.saveSettings(newSettings);
    setStatusBanner(`Activated ${id.toUpperCase()} as Primary Provider.`);
    setTimeout(() => setStatusBanner(null), 3000);
    onProviderUpdated?.();
  };

  const handleSetFallback = (id: AIProviderId) => {
    const newSettings = { ...settings, fallbackProvider: id };
    setSettings(newSettings);
    AppDatabase.saveSettings(newSettings);
    onProviderUpdated?.();
  };

  const toggleFallbackEnabled = () => {
    const newSettings = { ...settings, fallbackEnabled: !settings.fallbackEnabled };
    setSettings(newSettings);
    AppDatabase.saveSettings(newSettings);
    onProviderUpdated?.();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-indigo-950/40 to-neutral-900 border border-cyan-800/40 rounded-3xl p-5 md:p-6 shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase">
          <Sliders className="w-4 h-4" />
          <span>Multi-Engine Intelligence</span>
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-neutral-100 mt-1">
          AI & Model Manager
        </h1>
        <p className="text-sm text-neutral-400 max-w-2xl mt-1">
          Configure high-speed LLM engines. SHREYA features an intelligent Model Router with auto-fallback to guarantee 99.9% uptime.
        </p>
      </div>

      {statusBanner && (
        <div className="p-3.5 bg-cyan-950/80 border border-cyan-800 text-cyan-200 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* Model Router Fallback Topology Bar */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Automatic Fallback Router
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            If the primary model rate-limits or times out, SHREYA will automatically route to the fallback model.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
            <span className="text-neutral-500 font-medium">Primary:</span>
            <span className="font-bold text-cyan-400 uppercase">{settings.primaryProvider}</span>
          </div>

          <span className="text-neutral-600 font-mono">→</span>

          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
            <span className="text-neutral-500 font-medium">Fallback:</span>
            <select
              value={settings.fallbackProvider}
              onChange={(e) => handleSetFallback(e.target.value as AIProviderId)}
              className="bg-transparent text-neutral-200 font-bold uppercase focus:outline-none cursor-pointer"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id} className="bg-neutral-900 text-neutral-200">
                  {p.id}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={toggleFallbackEnabled}
            className={`px-3 py-1.5 rounded-xl font-medium border transition-colors cursor-pointer ${
              settings.fallbackEnabled
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
          >
            {settings.fallbackEnabled ? 'Fallback ON' : 'Fallback OFF'}
          </button>
        </div>
      </div>

      {/* Main Provider Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Provider List */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
            Configured Providers
          </span>
          {providers.map((prov) => {
            const isSelected = prov.id === activeProvider.id;
            const isPrimary = settings.primaryProvider === prov.id;
            const isFallback = settings.fallbackProvider === prov.id;

            return (
              <div
                key={prov.id}
                onClick={() => setSelectedProviderId(prov.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-neutral-900 border-cyan-500/80 shadow-lg shadow-cyan-950/20'
                    : 'bg-neutral-900/50 border-neutral-800/80 hover:bg-neutral-900 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      prov.id === 'groq'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : prov.id === 'gemini'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {prov.id.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-200">{prov.name}</span>
                      {isPrimary && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                          PRIMARY
                        </span>
                      )}
                      {isFallback && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-400 border border-purple-800">
                          FALLBACK
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 truncate max-w-[150px]">
                      {prov.model}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      prov.status === 'connected'
                        ? 'bg-emerald-400 animate-pulse'
                        : prov.status === 'error'
                        ? 'bg-rose-500'
                        : 'bg-neutral-600'
                    }`}
                  />
                  {prov.latencyMs ? (
                    <span className="text-[10px] font-mono text-neutral-500">
                      {prov.latencyMs}ms
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 2 Columns: Active Provider Editor */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                  <span>{activeProvider.name}</span>
                  {activeProvider.id === 'groq' && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      RECOMMENDED FOR ULTRA-LOW LATENCY
                    </span>
                  )}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  ID: <span className="font-mono text-cyan-400">{activeProvider.id}</span> • Architecture: OpenAI-compatible REST
                </p>
              </div>

              {settings.primaryProvider !== activeProvider.id && (
                <button
                  onClick={() => handleSetPrimary(activeProvider.id)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Activate as Primary</span>
                </button>
              )}
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-neutral-400" />
                  <span>API Key</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">
                  AES-256 Encrypted Keystore
                </span>
              </div>
              <div className="relative">
                <input
                  type={showKey[activeProvider.id] ? 'text' : 'password'}
                  value={activeProvider.apiKey || ''}
                  onChange={(e) => handleUpdateActiveField('apiKey', e.target.value)}
                  placeholder={
                    activeProvider.id === 'groq'
                      ? 'gsk_...'
                      : activeProvider.id === 'gemini'
                      ? 'AIzaSy...'
                      : 'sk-...'
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 font-mono focus:outline-none focus:border-cyan-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowKey((prev) => ({ ...prev, [activeProvider.id]: !prev[activeProvider.id] }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                >
                  {showKey[activeProvider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500">
                Never logged or exposed. Stored locally inside the secure hardware-assisted keystore.
              </p>
            </div>

            {/* Model Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Model Name</label>
                <select
                  value={activeProvider.model}
                  onChange={(e) => handleUpdateActiveField('model', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-cyan-500"
                >
                  {activeProvider.availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Base URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Base URL</span>
                </label>
                <input
                  type="text"
                  value={activeProvider.baseUrl}
                  onChange={(e) => handleUpdateActiveField('baseUrl', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Test Connection Result Box */}
            {testResults[activeProvider.id] && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResults[activeProvider.id].success
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-800 text-rose-300'
                }`}
              >
                {testResults[activeProvider.id].success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">
                    {testResults[activeProvider.id].success ? 'Connection Successful' : 'Connection Failed'}
                  </div>
                  <div>{testResults[activeProvider.id].message}</div>
                </div>
              </div>
            )}

            {/* Actions: TEST CONNECTION, SAVE */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => handleTestConnection(activeProvider.id)}
                disabled={testingId === activeProvider.id}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700/80 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingId === activeProvider.id ? 'animate-spin' : ''}`} />
                <span>{testingId === activeProvider.id ? 'Testing...' : 'TEST CONNECTION'}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-900/30 transition-all cursor-pointer active:scale-95"
                >
                  SAVE CONFIGURATION
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
