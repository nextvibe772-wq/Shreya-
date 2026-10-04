import React from 'react';
import { Menu, Sparkles, Table, Radio, Mic, MicOff, ShieldCheck, Smartphone } from 'lucide-react';
import { BackgroundServiceState } from '../../services/core/BackgroundService';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onToggleDrawer: () => void;
  primaryProvider: string;
  currentModel: string;
  bgState: BackgroundServiceState;
  hasSheetsAuth: boolean;
  activeSheetTitle?: string;
  isListening: boolean;
  onOpenInstallModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleDrawer,
  primaryProvider,
  currentModel,
  bgState,
  hasSheetsAuth,
  activeSheetTitle,
  isListening,
  onOpenInstallModal,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl px-4 py-2.5 flex items-center justify-between gap-3">
      {/* Left: Drawer button + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleDrawer}
          className="p-2 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-all cursor-pointer"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 font-sans">
                SHREYA
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 hidden sm:block">AI Voice Core</p>
          </div>
        </div>
      </div>

      {/* Center / Right Badges */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {/* Provider badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-neutral-300 font-medium capitalize">{primaryProvider}</span>
          <span className="text-neutral-500 text-[10px] max-w-[100px] truncate">({currentModel})</span>
        </div>

        {/* Google Sheets Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            hasSheetsAuth
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
          }`}
          title={hasSheetsAuth ? `Connected to Google Sheets: ${activeSheetTitle || 'Ready'}` : 'Google Sheets Disconnected'}
        >
          <Table className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Sheets:</span>
          <span>{hasSheetsAuth ? 'Active' : 'Offline'}</span>
        </div>

        {/* Background Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
            bgState.isActive
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
              : 'bg-neutral-900/80 border-neutral-800 text-neutral-400'
          }`}
          title={bgState.isActive ? 'Background Assistant Service is Active' : 'Background Mode Off'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              bgState.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="hidden sm:inline">Background:</span>
          <span>{bgState.isActive ? 'Active' : 'Off'}</span>
        </div>

        {/* Mic status indicator */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
            isListening
              ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300 animate-pulse'
              : bgState.isMicPaused
              ? 'bg-amber-950/40 border-amber-800 text-amber-300'
              : 'bg-neutral-900/80 border-neutral-800 text-neutral-400'
          }`}
        >
          {isListening ? (
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
          ) : bgState.isMicPaused ? (
            <MicOff className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Mic className="w-3.5 h-3.5 text-neutral-500" />
          )}
          <span className="text-[11px]">
            {isListening ? 'Listening' : bgState.isMicPaused ? 'Paused' : 'Ready'}
          </span>
        </div>

        {/* APK / PWA Install Button */}
        <PWAInstallButton onOpenGuide={onOpenInstallModal} />
      </div>
    </header>
  );
};
