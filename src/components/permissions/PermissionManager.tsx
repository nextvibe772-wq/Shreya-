import React, { useState, useEffect } from 'react';
import {
  Shield,
  Mic,
  Bell,
  Bluetooth,
  Table,
  Lock,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { getAccessToken } from '../../services/auth/firebaseAuth';

export const PermissionManager: React.FC<{ onOpenSheets: () => void }> = ({ onOpenSheets }) => {
  const [micState, setMicState] = useState<string>('prompt');
  const [notificationState, setNotificationState] = useState<string>('default');
  const [hasSheetsToken, setHasSheetsToken] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    // 1. Microphone
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const res = await navigator.permissions.query({ name: 'microphone' as any });
        setMicState(res.state);
        res.onchange = () => setMicState(res.state);
      } catch {}
    }

    // 2. Notifications
    if ('Notification' in window) {
      setNotificationState(Notification.permission);
    }

    // 3. Sheets
    const token = await getAccessToken();
    setHasSheetsToken(Boolean(token));
  };

  const requestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicState('granted');
    } catch {
      setMicState('denied');
    }
  };

  const requestNotification = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      setNotificationState(res);
    }
  };

  const permissionsList = [
    {
      id: 'mic',
      name: 'Microphone & Audio Input',
      description: 'Required for real-time speech recognition (STT) and voice commands.',
      status: micState,
      icon: Mic,
      action: requestMicrophone,
      actionLabel: 'Grant Access',
    },
    {
      id: 'notifications',
      name: 'System Notifications',
      description: 'Used for persistent background assistant notification & scheduled reminders.',
      status: notificationState,
      icon: Bell,
      action: requestNotification,
      actionLabel: 'Enable Notifications',
    },
    {
      id: 'sheets',
      name: 'Google Sheets OAuth Workspace',
      description: 'Required to read, write, create, and append rows into Google Spreadsheets.',
      status: hasSheetsToken ? 'granted' : 'prompt',
      icon: Table,
      action: onOpenSheets,
      actionLabel: hasSheetsToken ? 'Manage Sheets' : 'Sign in with Google',
    },
    {
      id: 'bluetooth',
      name: 'Web Bluetooth & Nearby BLE',
      description: 'Enables scanning and connecting to smart IoT beacons, ESP32 nodes, and sensors.',
      status: typeof navigator !== 'undefined' && 'bluetooth' in navigator ? 'granted' : 'denied',
      icon: Bluetooth,
      actionLabel: 'Supported in Browser',
    },
    {
      id: 'storage',
      name: 'Android Keystore / Secure Storage',
      description: 'Local encrypted vault for storing API keys with zero plaintext exposure.',
      status: 'granted',
      icon: HardDrive,
      actionLabel: 'Active',
    },
    {
      id: 'wakelock',
      name: 'Screen Wake Lock & Keep-Alive',
      description: 'Simulates Android foreground service keeping voice listeners awake.',
      status: typeof navigator !== 'undefined' && 'wakeLock' in navigator ? 'granted' : 'denied',
      icon: Lock,
      actionLabel: 'Hardware Supported',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase font-mono">
          <Shield className="w-4 h-4" />
          <span>Security & Authorization</span>
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-neutral-100 mt-1">
          Permission Manager
        </h1>
        <p className="text-sm text-neutral-400 max-w-xl mt-1">
          SHREYA adheres strictly to Android zero-trust permission guidelines. Grant access only when needed.
        </p>
      </div>

      {/* Permissions List */}
      <div className="space-y-3">
        {permissionsList.map((item) => {
          const Icon = item.icon;
          const isGranted = item.status === 'granted';
          return (
            <div
              key={item.id}
              className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl border mt-0.5 ${
                    isGranted
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-neutral-200">{item.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isGranted
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : item.status === 'denied'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>
                </div>
              </div>

              {item.action && (
                <button
                  onClick={item.action}
                  disabled={isGranted}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    isGranted
                      ? 'bg-neutral-800 text-neutral-500 cursor-default'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-neutral-950'
                  }`}
                >
                  {isGranted ? 'Granted ✓' : item.actionLabel}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
