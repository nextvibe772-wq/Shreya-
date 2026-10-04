import React from 'react';
import {
  MessageSquare,
  Table,
  CheckSquare,
  Cpu,
  Database,
  Sliders,
  Shield,
  Terminal,
  Settings,
  X,
  Sparkles,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';

export type AppTab =
  | 'chat'
  | 'sheets'
  | 'tasks'
  | 'devices'
  | 'memory'
  | 'providers'
  | 'permissions'
  | 'developer'
  | 'settings';

interface NavigationDrawerProps {
  isOpen: boolean;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onClose: () => void;
  hasSheetsAuth: boolean;
  conversationCount: number;
  onOpenInstallModal: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  activeTab,
  onSelectTab,
  onClose,
  hasSheetsAuth,
  conversationCount,
  onOpenInstallModal,
}) => {
  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'chat' as AppTab,
      label: 'Voice & AI Chat',
      icon: MessageSquare,
      badge: conversationCount > 0 ? `${conversationCount}` : undefined,
      description: 'Primary interactive assistant hub',
    },
    {
      id: 'sheets' as AppTab,
      label: 'Google Sheets Studio',
      icon: FileSpreadsheet,
      badge: hasSheetsAuth ? 'Connected' : 'Sign In',
      badgeColor: hasSheetsAuth ? 'bg-emerald-900/60 text-emerald-300' : 'bg-amber-900/60 text-amber-300',
      description: 'Create, read & append spreadsheet logs',
    },
    {
      id: 'tasks' as AppTab,
      label: 'Tasks & Reminders',
      icon: CheckSquare,
      description: 'To-do management & alert schedules',
    },
    {
      id: 'devices' as AppTab,
      label: 'Devices & Smart Home',
      icon: Cpu,
      description: 'ESP32, Raspberry Pi, BLE & PC bridge',
    },
    {
      id: 'memory' as AppTab,
      label: 'Memory Vault',
      icon: Database,
      description: 'Short & long-term memory store',
    },
    {
      id: 'providers' as AppTab,
      label: 'AI & Models (Groq / Gemini)',
      icon: Sliders,
      description: 'Groq Cloud, OpenAI, Gemini, custom APIs',
    },
    {
      id: 'permissions' as AppTab,
      label: 'Permission Manager',
      icon: Shield,
      description: 'Mic, speech, notifications & hardware',
    },
    {
      id: 'developer' as AppTab,
      label: 'Developer Console',
      icon: Terminal,
      description: 'System diagnostics & latency probes',
    },
    {
      id: 'settings' as AppTab,
      label: 'Settings & Personality',
      icon: Settings,
      description: 'Languages, Hindi/Hinglish, voice & theme',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Body */}
      <div className="relative w-80 max-w-[85vw] h-full bg-neutral-950 border-r border-neutral-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-100 text-base tracking-wide">SHREYA CORE</h2>
              <p className="text-[11px] text-cyan-400 font-mono">Personal AI Architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Nav Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/80 to-indigo-950/40 border border-cyan-800/60 text-cyan-200 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-cyan-500 text-neutral-950 font-bold'
                        : 'bg-neutral-900 text-neutral-400 group-hover:text-cyan-400 group-hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm leading-tight text-neutral-200 group-hover:text-white">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate max-w-[150px]">
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      item.badgeColor || 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/40 space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenInstallModal();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-950/40"
          >
            <Smartphone className="w-4 h-4" />
            <span>Install on Android (APK)</span>
          </button>

          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SHREYA v2.4 Engine
            </span>
            <span className="font-mono text-[10px] text-neutral-500">Android WebAPK</span>
          </div>
        </div>
      </div>
    </div>
  );
};
