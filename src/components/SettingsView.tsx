import React from 'react';
import { TabType, PlanType } from '../types';
import { useApiKeys } from '../hooks/useApiKeys';
import {
  Settings,
  Crown,
  Scan,
  Receipt,
  Zap,
  ArrowRight,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Trash2,
  Key,
  ExternalLink,
} from 'lucide-react';

interface SettingsViewProps {
  planType: PlanType;
  isPro: boolean;
  scansUsed: number;
  scansRemaining: number;
  receiptCount: number;
  maxReceipts: number;
  onUpgrade: () => void;
  onDowngrade: () => void;
  setActiveTab: (tab: TabType) => void;
  showToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  planType,
  isPro,
  scansUsed,
  scansRemaining,
  receiptCount,
  maxReceipts,
  onUpgrade,
  onDowngrade,
  setActiveTab,
  showToast,
}) => {
  const apiKeys = useApiKeys();

  const handleResetAll = () => {
    if (window.confirm('Réinitialiser TOUTES les données ? Ceci est irréversible.')) {
      [
        'docusnap.receipts.v1',
        'docusnap.whatsapp.v1',
        'docusnap.integrations.v1',
        'docusnap.webhooklogs.v1',
        'docusnap.plan.v1',
        'docusnap.usage.v1',
      ].forEach((k) => window.localStorage.removeItem(k));
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Paramètres du compte</h2>
          <p className="text-xs text-slate-400">Gérez votre plan, utilisation et préférences.</p>
        </div>
      </div>

      {/* Plan Card */}
      <div className={`bg-slate-900 border rounded-2xl p-5 shadow-xl ${isPro ? 'border-cyan-500/30' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPro
                ? 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white'
                : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}>
              {isPro ? <Zap className="w-5 h-5" /> : <Scan className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Plan {isPro ? 'Pro' : 'Free'}
              </h3>
              <p className="text-xs text-slate-400">
                {isPro ? '29€/mois — Toutes les fonctionnalités' : 'Gratuit — Fonctionnalités de base'}
              </p>
            </div>
          </div>
          {isPro ? (
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              PRO ACTIF
            </span>
          ) : (
            <button
              onClick={() => setActiveTab('pricing')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              Upgrade <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Usage Stats */}
        <div className="space-y-3">
          {/* Scans */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-cyan-400" /> Scans OCR ce mois
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {scansUsed} / {scansRemaining === Infinity ? '∞' : scansRemaining}
              </span>
            </div>
            {scansRemaining !== Infinity && (
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    scansUsed / (scansRemaining + scansUsed) > 0.8 ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.min((scansUsed / (scansRemaining + scansUsed)) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Receipts */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" /> Reçus enregistrés
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {receiptCount} / {maxReceipts === Infinity ? '∞' : maxReceipts}
              </span>
            </div>
          </div>

          {/* Engine */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Moteur OCR actif
            </span>
            <span className={`text-xs font-mono font-bold ${isPro ? 'text-cyan-400' : 'text-emerald-400'}`}>
              {isPro ? 'Gemini Vision AI' : 'Tesseract local'}
            </span>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Clés API personnelles</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Configure tes propres clés pour une meilleure précision. Elles sont stockées localement dans ton navigateur — jamais partagées.
        </p>

        <div className="space-y-3">
          {/* Gemini */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> Gemini API Key
                {apiKeys.hasGemini && <span className="text-[10px] text-emerald-400 font-mono">✓ CONFIGURÉE</span>}
              </label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
              >
                Obtenir une clé gratuite <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={apiKeys.geminiKey}
              onChange={(e) => apiKeys.setGeminiKey(e.target.value)}
              placeholder="AIza... (optionnel — la clé du serveur est utilisée par défaut)"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <p className="text-[10px] text-slate-500 mt-1.5">
              100% gratuit, pas de CB. Restreins le domaine à *.github.io dans Google AI Studio pour la sécurité.
            </p>
          </div>
        </div>
      </div>

      {/* Features Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4">Fonctionnalités débloquées</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { name: 'Dashboard & KPIs', ok: true },
            { name: 'Export CSV', ok: true },
            { name: 'Scanner OCR local', ok: true },
            { name: 'OCR Gemini Vision', ok: isPro },
            { name: 'Bot WhatsApp', ok: isPro },
            { name: 'Webhooks personnalisés', ok: isPro },
            { name: 'Google Sheets sync', ok: isPro },
            { name: 'Support prioritaire', ok: isPro },
          ].map(({ name, ok }) => (
            <div
              key={name}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                ok
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800/50 border border-slate-800 text-slate-500'
              }`}
            >
              {ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Zone de danger
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Réinitialiser toutes les données (reçus, plan, config)</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Irréversible — retour à l'état initial de la démo.</p>
          </div>
          <button
            onClick={handleResetAll}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            Tout réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};
