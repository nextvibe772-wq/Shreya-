import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install, isInstalled, isAndroid, isIOS } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-fif35mf72xb4eosvkjev6x-21221314679.asia-southeast1.run.app';
  const pwaBuilderUrl = `https://www.pwabuilder.com/?site=${encodeURIComponent(currentAppUrl)}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                <span>SHREYA Android APK & App Install</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Android Native
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Is application ko apne Android phone me install & APK download karne ke 2 aasan tareeqe:
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method 1: Instant 1-Click Android WebAPK (Recommended) */}
        <div className="bg-gradient-to-br from-cyan-950/40 via-neutral-950 to-neutral-900 border border-cyan-800/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Tareeqa 1: Direct 1-Tap Android Install (WebAPK)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Sabse Aasan & Best
            </span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            Google Chrome Android par is app ko <strong>Real Native App (WebAPK)</strong> ki tarah install karta hai. Isme app icon, app drawer, notifications, aur microphone background me bilkul native APK ki tarah chalte hain!
          </p>

          <div className="p-3 bg-neutral-950/90 rounded-xl border border-neutral-800 text-xs text-neutral-400 space-y-1.5">
            <p><strong>Step 1:</strong> Apne Android mobile par Google Chrome me ye URL kholein.</p>
            <p><strong>Step 2:</strong> Chrome ke Top-Right 3 dots (⋮) par tap karein aur <strong>&ldquo;Install app&rdquo;</strong> ya <strong>&ldquo;Add to Home Screen&rdquo;</strong> chunein.</p>
          </div>

          {isInstallable && (
            <button
              onClick={() => {
                install();
                onClose();
              }}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>INSTALL SHREYA ON THIS DEVICE NOW</span>
            </button>
          )}
        </div>

        {/* Method 2: Download Standalone .APK File via PWABuilder */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Tareeqa 2: Standalone .APK File Download (PWABuilder)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800">
              .APK / .AAB
            </span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            Agar aapko direct <strong>.apk installer file</strong> chahiye jo kisi bhi phone me install ho sake:
          </p>

          <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Aapka App URL:</span>
              <button
                onClick={copyUrl}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied URL!' : 'Copy URL'}</span>
              </button>
            </div>
            <div className="p-2 bg-neutral-950 rounded-lg font-mono text-[11px] text-neutral-300 truncate border border-neutral-800/80">
              {currentAppUrl}
            </div>

            <ol className="list-decimal list-inside space-y-1 text-neutral-400 pt-1 text-[11px]">
              <li>Neeche diye gaye button se <strong>PWABuilder</strong> kholein.</li>
              <li>Ye automatically aapka URL test karke <strong>Android package</strong> banayega.</li>
              <li><strong>&ldquo;Package for Android&rdquo;</strong> par tap karke <strong>&ldquo;Download APK&rdquo;</strong> select karein.</li>
              <li>Aapka signed <strong>SHREYA.apk</strong> download ho jayega!</li>
            </ol>
          </div>

          <a
            href={pwaBuilderUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 cursor-pointer transition-all"
          >
            <span>Open PWABuilder & Generate .APK</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Method 3: Capacitor Android CLI (For Developers) */}
        <div className="p-4 bg-neutral-950/50 border border-neutral-800/60 rounded-2xl space-y-2 text-xs">
          <span className="font-semibold text-neutral-400">Developers (Capacitor / Android Studio):</span>
          <pre className="p-2.5 bg-neutral-900 rounded-xl text-[11px] font-mono text-cyan-300 overflow-x-auto">
{`npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "SHREYA" "com.shreya.assistant" --web-dir "dist"
npm run build
npx cap add android && npx cap open android`}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
