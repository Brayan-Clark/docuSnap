import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 text-slate-100 px-4 py-3 rounded-2xl shadow-2xl shadow-cyan-500/20 flex items-center gap-3 max-w-md">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
          <Sparkles className="w-4 h-4 animate-spin" />
        </div>
        <p className="text-xs font-semibold leading-snug">{message}</p>
      </div>
    </div>
  );
};
