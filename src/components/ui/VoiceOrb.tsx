import React from 'react';
import { AssistantVoiceState } from '../../types';
import { Mic, Volume2, Loader2, AlertCircle } from 'lucide-react';

interface VoiceOrbProps {
  state: AssistantVoiceState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  pulse?: boolean;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  size = 'md',
  onClick,
  pulse = true,
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  }[size];

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const stateStyles = {
    idle: {
      gradient: 'from-cyan-500/20 via-blue-600/30 to-purple-600/20',
      border: 'border-cyan-500/30',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.25)]',
      icon: <Mic className={`${iconSizes} text-cyan-400`} />,
      statusText: 'Tap to speak',
    },
    listening: {
      gradient: 'from-cyan-400 via-sky-500 to-indigo-600',
      border: 'border-cyan-300',
      glow: 'shadow-[0_0_60px_rgba(6,182,212,0.6)] animate-pulse',
      icon: <Mic className={`${iconSizes} text-white animate-bounce`} />,
      statusText: 'Listening...',
    },
    processing: {
      gradient: 'from-violet-500 via-purple-600 to-pink-500',
      border: 'border-purple-400/50',
      glow: 'shadow-[0_0_50px_rgba(168,85,247,0.5)]',
      icon: <Loader2 className={`${iconSizes} text-white animate-spin`} />,
      statusText: 'Thinking...',
    },
    speaking: {
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      border: 'border-emerald-300',
      glow: 'shadow-[0_0_60px_rgba(16,185,129,0.55)]',
      icon: <Volume2 className={`${iconSizes} text-white animate-pulse`} />,
      statusText: 'Speaking (Tap to interrupt)',
    },
    error: {
      gradient: 'from-rose-500 via-red-600 to-amber-600',
      border: 'border-red-400',
      glow: 'shadow-[0_0_40px_rgba(239,68,68,0.4)]',
      icon: <AlertCircle className={`${iconSizes} text-white`} />,
      statusText: 'Error',
    },
  }[state];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <button
        onClick={onClick}
        className={`relative group rounded-full p-1 flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 ${
          stateStyles.glow
        }`}
        title={`SHREYA: ${stateStyles.statusText}`}
      >
        {/* Outer glowing aura ripples when listening or speaking */}
        {pulse && (state === 'listening' || state === 'speaking') && (
          <>
            <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping opacity-75 duration-1000" />
            <span className="absolute -inset-2 rounded-full bg-cyan-400/10 animate-pulse duration-700" />
          </>
        )}

        {/* Core Orb */}
        <div
          className={`${sizeClasses} rounded-full bg-gradient-to-tr ${stateStyles.gradient} border ${stateStyles.border} backdrop-blur-md flex items-center justify-center transition-all duration-500 relative overflow-hidden`}
        >
          {/* Internal rotating light sweep */}
          <div className="absolute inset-0 bg-radial from-white/20 to-transparent opacity-60 pointer-events-none" />

          {/* Center icon */}
          <div className="relative z-10">{stateStyles.icon}</div>
        </div>
      </button>

      {size !== 'sm' && (
        <span className="text-xs font-medium tracking-wide uppercase text-neutral-400 select-none">
          {stateStyles.statusText}
        </span>
      )}
    </div>
  );
};
