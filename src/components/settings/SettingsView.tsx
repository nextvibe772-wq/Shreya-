import React, { useState } from 'react';
import {
  Settings,
  User,
  Languages,
  Volume2,
  Mic,
  Radio,
  Battery,
  Shield,
  Trash2,
  CheckCircle2,
  VolumeX,
} from 'lucide-react';
import { ShreyaSettings, AssistantLanguage, PersonalityMode } from '../../types';
import { AppDatabase } from '../../services/storage/database';
import { ttsManager } from '../../services/voice/TTSManager';
import { backgroundService, BackgroundServiceState } from '../../services/core/BackgroundService';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface SettingsViewProps {
  bgState: BackgroundServiceState;
  onSettingsChanged: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  bgState,
  onSettingsChanged,
}) => {
  const [settings, setSettings] = useState<ShreyaSettings>(() => AppDatabase.getSettings());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => ttsManager.getVoices());
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmWipeOpen, setConfirmWipeOpen] = useState(false);

  const updateSetting = <K extends keyof ShreyaSettings>(key: K, value: ShreyaSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    AppDatabase.saveSettings(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
    onSettingsChanged();
  };

  const handleToggleBackground = async () => {
    if (bgState.isActive) {
      backgroundService.stopService();
    } else {
      await backgroundService.startService();
    }
    onSettingsChanged();
  };

  const handleTogglePauseMic = () => {
    if (bgState.isMicPaused) {
      backgroundService.resumeMic();
    } else {
      backgroundService.pauseMic();
    }
    onSettingsChanged();
  };

  const handleWipeAllData = () => {
    AppDatabase.clearAllData();
    setConfirmWipeOpen(false);
    window.location.reload();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase">
            <Settings className="w-4 h-4" />
            <span>Assistant Configuration</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-neutral-100 mt-1">
            Settings & Personality
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl mt-1">
            Personalize SHREYA&apos;s voice tone, multilingual Hindi/English dialect, and background behavior.
          </p>
        </div>

        {savedNotice && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-semibold rounded-xl animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
      </div>

      {/* Background Assistant Mode Card (Major Requirement) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                bgState.isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">Background Assistant Mode</h2>
              <p className="text-xs text-neutral-400">
                Simulates Android Foreground Service with persistent notifications and wake-lock keep-alive.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBackground}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                bgState.isActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950'
              }`}
            >
              {bgState.isActive ? 'STOP ASSISTANT' : 'START ASSISTANT'}
            </button>
          </div>
        </div>

        {/* Background Status & Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-400">Background State:</span>
            <span
              className={`font-bold flex items-center gap-1.5 ${
                bgState.isActive ? 'text-emerald-400' : 'text-neutral-500'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  bgState.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
                }`}
              />
              {bgState.isActive ? '🟢 Background Active' : '🔴 Background Off'}
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-400">Microphone State:</span>
            <span
              className={`font-bold ${
                bgState.isMicPaused ? 'text-amber-400' : 'text-cyan-400'
              }`}
            >
              {bgState.isMicPaused ? '🔇 Mic Paused' : '🎙️ Mic Listening'}
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-end">
            <button
              onClick={handleTogglePauseMic}
              disabled={!bgState.isActive}
              className="w-full py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              {bgState.isMicPaused ? 'RESUME MIC' : 'PAUSE MIC'}
            </button>
          </div>
        </div>
      </div>

      {/* Language, Hindi & Hinglish Preferences */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <Languages className="w-5 h-5 text-cyan-400" />
          Language & Dialect (Hindi / Hinglish / English)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'en-US' as AssistantLanguage, name: 'English (US / Global)', sample: '“How can I help you today?”' },
            { id: 'hi-IN' as AssistantLanguage, name: 'Hindi (हिंदी)', sample: '“नमस्ते! आज मैं आपकी क्या मदद कर सकती हूँ?”' },
            { id: 'hinglish' as AssistantLanguage, name: 'Hinglish (Urban Indian)', sample: '“Haanji! Aaj kya kaam karna hai?”' },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => updateSetting('language', lang.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                settings.language === lang.id
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="font-bold text-sm text-neutral-200">{lang.name}</div>
              <p className="text-xs text-neutral-400 italic mt-1">{lang.sample}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Personality & Tone */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-400" />
          Assistant Personality
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {(['friendly', 'concise', 'analytical', 'creative'] as PersonalityMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSetting('personality', mode)}
              className={`p-3 rounded-xl border text-center capitalize font-semibold transition-all cursor-pointer ${
                settings.personality === mode
                  ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Your Name</label>
            <input
              type="text"
              value={settings.userName}
              onChange={(e) => updateSetting('userName', e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Assistant Name</label>
            <input
              type="text"
              value={settings.assistantName}
              onChange={(e) => updateSetting('assistantName', e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Voice & TTS Controls */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-emerald-400" />
          Voice Synthesis (TTS) & Speed
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-200">Auto Speak Responses</span>
              <p className="text-[11px] text-neutral-500">Automatically read AI responses aloud</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={(e) => updateSetting('autoSpeak', e.target.checked)}
              className="w-5 h-5 rounded text-cyan-500 bg-neutral-950 border-neutral-800 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-200">Continuous Conversation Mode</span>
              <p className="text-[11px] text-neutral-500">Automatically listen again after finishing speech</p>
            </div>
            <input
              type="checkbox"
              checked={settings.continuousConversation}
              onChange={(e) => updateSetting('continuousConversation', e.target.checked)}
              className="w-5 h-5 rounded text-cyan-500 bg-neutral-950 border-neutral-800 cursor-pointer"
            />
          </div>

          {/* Voice Speed Slider */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Speech Speed Rate</span>
              <span className="font-mono text-cyan-400 font-bold">{settings.voiceSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.voiceSpeed}
              onChange={(e) => updateSetting('voiceSpeed', parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Battery & Power Profile */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <Battery className="w-5 h-5 text-amber-400" />
          Battery & Power Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { id: 'performance', name: 'Performance Mode', desc: 'Highest responsiveness & continuous wake lock' },
            { id: 'balanced', name: 'Balanced (Recommended)', desc: 'Standard wake-word polling & audio keep-alive' },
            { id: 'saver', name: 'Battery Saver', desc: 'Reduces background frequency & halts continuous listen' },
          ].map((profile) => (
            <button
              key={profile.id}
              onClick={() => updateSetting('batteryMode', profile.id as any)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                settings.batteryMode === profile.id
                  ? 'bg-amber-950/50 border-amber-500/80 text-amber-200'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="font-semibold text-neutral-200">{profile.name}</div>
              <p className="text-[11px] text-neutral-500 mt-1">{profile.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Privacy & Factory Reset */}
      <div className="bg-neutral-900/90 border border-rose-950/40 rounded-3xl p-5 md:p-6 space-y-4">
        <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-rose-400" />
          Privacy & Storage Reset
        </h2>
        <p className="text-xs text-neutral-400">
          All conversation logs, custom memory, and tokens are stored locally on your device. Never shared with third parties.
        </p>

        <button
          onClick={() => setConfirmWipeOpen(true)}
          className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Wipe All Local Data & Reset</span>
        </button>
      </div>

      {/* Confirmation Modal for factory wipe */}
      <ConfirmationModal
        isOpen={confirmWipeOpen}
        title="Reset All Assistant Data?"
        message="This will delete all conversations, memories, tasks, and stored configurations permanently. Do you wish to proceed?"
        confirmText="Confirm Factory Reset"
        isDestructive={true}
        onConfirm={handleWipeAllData}
        onCancel={() => setConfirmWipeOpen(false)}
      />
    </div>
  );
};
