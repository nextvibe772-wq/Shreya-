import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDestructive ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-neutral-300 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700/80 rounded-xl transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-medium rounded-xl transition-all shadow-lg ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
