import React from 'react';
import { Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenGuide: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onOpenGuide }) => {
  const { isInstallable, install, isInstalled } = usePWAInstall();

  if (isInstalled) {
    return null;
  }

  return (
    <button
      onClick={() => {
        if (isInstallable) {
          install();
        } else {
          onOpenGuide();
        }
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-neutral-950 font-bold text-xs shadow-md shadow-cyan-950 transition-all cursor-pointer active:scale-95 shrink-0"
      title="Download APK / Install on Android"
    >
      <Smartphone className="w-3.5 h-3.5" />
      <span>{isInstallable ? 'Install App' : 'Get APK'}</span>
    </button>
  );
};
