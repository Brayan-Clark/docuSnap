import React, { useState } from 'react';
import { Scan, Mail, Lock, LogIn, UserPlus, AlertCircle, Sparkles } from 'lucide-react';

interface AuthViewProps {
  mode: 'login' | 'register';
  onToggleMode: () => void;
  onSubmit: (email: string, password: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  onClearError: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  mode,
  onToggleMode,
  onSubmit,
  loading,
  error,
  onClearError,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSubmit(email, password);
    if (ok) { setEmail(''); setPassword(''); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 mx-auto shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Scan className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Docu<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">Snap AI</span>
          </h1>
          <p className="text-sm text-slate-400">
            {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte gratuit'}
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          {/* Error */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); onClearError(); }}
              placeholder="vous@entreprise.com"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" /> Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); onClearError(); }}
              placeholder={mode === 'register' ? '6 caractères minimum' : '••••••••'}
              required
              minLength={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <><LogIn className="w-4 h-4" /> Se connecter</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Créer mon compte</>
            )}
          </button>

          {/* Toggle */}
          <p className="text-xs text-center text-slate-400">
            {mode === 'login' ? (
              <>Pas encore de compte ?{' '}
                <button type="button" onClick={onToggleMode} className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer">
                  Créer un compte gratuit
                </button></>
            ) : (
              <>Déjà un compte ?{' '}
                <button type="button" onClick={onToggleMode} className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer">
                  Se connecter
                </button></>
            )}
          </p>
        </form>

        {/* Demo mode hint */}
        <div className="text-center">
          <p className="text-[11px] text-slate-500">
            💡 Vous pouvez aussi utiliser l'application{' '}
            <span className="text-slate-400 font-medium">sans compte</span> en mode démo.
          </p>
        </div>
      </div>
    </div>
  );
};
