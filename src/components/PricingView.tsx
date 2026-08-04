import React, { useState } from 'react';
import { PlanType, PLANS, PlanConfig } from '../types';
import {
  Check,
  X,
  Zap,
  Sparkles,
  MessageSquare,
  Webhook,
  FileSpreadsheet,
  Crown,
  ShieldCheck,
  ArrowRight,
  Scan,
} from 'lucide-react';

interface PricingViewProps {
  currentPlan: PlanType;
  isPro: boolean;
  scansUsed: number;
  onUpgrade: () => void;
  onDowngrade: () => void;
  showToast: (msg: string) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({
  currentPlan,
  isPro,
  scansUsed,
  onUpgrade,
  onDowngrade,
  showToast,
}) => {
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPaid(true);
      setTimeout(() => {
        onUpgrade();
        setShowPayment(false);
        setPaid(false);
        showToast('🎉 Bienvenue Pro ! Toutes les fonctionnalités sont débloquées.');
      }, 1500);
    }, 2200);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-extrabold text-white">Choisissez votre formule</h2>
        </div>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Commencez gratuitement, passez à Pro quand vous êtes prêt. Sans engagement, sans surprise.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* FREE */}
        <PlanCard
          config={PLANS.free}
          isCurrent={currentPlan === 'free'}
          scansUsed={scansUsed}
          onSelect={() => {
            if (isPro) {
              onDowngrade();
              showToast('Repassé au plan Free.');
            }
          }}
        />

        {/* PRO */}
        <PlanCard
          config={PLANS.pro}
          isCurrent={currentPlan === 'pro'}
          scansUsed={scansUsed}
          onSelect={() => {
            if (!isPro) setShowPayment(true);
          }}
          popular
        />
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg max-w-3xl mx-auto">
        <h3 className="text-sm font-bold text-white mb-4">Comparaison détaillée</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800">
              <tr>
                <th className="py-2 px-3 text-slate-400 font-medium">Fonctionnalité</th>
                <th className="py-2 px-3 text-slate-300 font-semibold text-center">Free</th>
                <th className="py-2 px-3 text-cyan-400 font-semibold text-center">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {[
                { feat: 'Scans OCR / mois', free: '10', pro: 'Illimité' },
                { feat: 'Moteur OCR', free: 'Tesseract local', pro: 'Gemini Vision AI' },
                { feat: 'Précision OCR', free: '~93%', pro: '~98%' },
                { feat: 'Dashboard & KPIs', free: <CheckIcon />, pro: <CheckIcon /> },
                { feat: 'Export CSV', free: <CheckIcon />, pro: <CheckIcon /> },
                { feat: 'Bot WhatsApp', free: <CrossIcon />, pro: <CheckIcon /> },
                { feat: 'Webhooks personnalisés', free: <CrossIcon />, pro: <CheckIcon /> },
                { feat: 'Google Sheets sync', free: <CrossIcon />, pro: <CheckIcon /> },
                { feat: 'Max reçus enregistrés', free: '50', pro: 'Illimité' },
                { feat: 'Support', free: 'Communauté', pro: 'Prioritaire' },
              ].map(({ feat, free, pro }) => (
                <tr key={feat} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 text-slate-300 font-medium">{feat}</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">{free}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-400 font-semibold">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            {!paid ? (
              <>
                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-cyan-600 to-teal-500 text-center">
                  <Crown className="w-8 h-8 text-white mx-auto mb-2" />
                  <h3 className="text-lg font-extrabold text-white">Upgrade vers Pro</h3>
                  <p className="text-sm text-white/80">Accès complet — 29€/mois, annulable</p>
                </div>

                <div className="p-6 space-y-5">
                  {/* Summary */}
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">DocuSnap AI Pro</div>
                      <div className="text-sm font-bold text-white">Abonnement mensuel</div>
                    </div>
                    <div className="text-xl font-black text-cyan-400">29€<span className="text-xs font-normal text-slate-400">/mois</span></div>
                  </div>

                  {/* Card Form (simulated Stripe) */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1.5">Numéro de carte</label>
                      <input
                        type="text"
                        defaultValue="4242 4242 4242 4242"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1.5">Expiration</label>
                        <input
                          type="text"
                          defaultValue="12/28"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1.5">CVC</label>
                        <input
                          type="text"
                          defaultValue="123"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={handlePay}
                    disabled={processing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        Traitement en cours…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Payer 29€/mois
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowPayment(false)}
                    disabled={processing}
                    className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>

                  <p className="text-[10px] text-slate-500 text-center">
                    🔒 Paiement simulé — aucune carte réelle n'est requise pour cette démo.
                  </p>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="p-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-extrabold text-white">Paiement confirmé ! 🎉</h3>
                <p className="text-sm text-slate-400">Bienvenue dans DocuSnap AI Pro. Toutes les fonctionnalités sont débloquées.</p>
                <div className="text-xs text-slate-500 font-mono">Redirection automatique…</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components ---

const CheckIcon = () => <Check className="w-4 h-4 text-emerald-400 inline" />;
const CrossIcon = () => <X className="w-4 h-4 text-slate-600 inline" />;

const PlanCard: React.FC<{
  config: PlanConfig;
  isCurrent: boolean;
  scansUsed: number;
  onSelect: () => void;
  popular?: boolean;
}> = ({ config, isCurrent, onSelect, popular }) => {
  const isFree = config.type === 'free';
  return (
    <div
      className={`relative bg-slate-900 border rounded-2xl p-6 shadow-xl transition-all ${
        popular && !isCurrent
          ? 'border-cyan-500/50 shadow-cyan-500/10'
          : 'border-slate-800'
      } ${isCurrent ? 'ring-2 ring-cyan-500/40' : ''}`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-[10px] font-extrabold text-white uppercase tracking-wider">
          ⚡ Plus populaire
        </div>
      )}

      <div className="text-center mb-5 pt-2">
        <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center ${
          isFree
            ? 'bg-slate-800 border border-slate-700 text-slate-400'
            : 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/20'
        }`}>
          {isFree ? <Scan className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
        </div>
        <h3 className="text-lg font-extrabold text-white">{config.label}</h3>
        <div className="mt-2">
          <span className="text-3xl font-black text-white">{config.price}€</span>
          <span className="text-sm text-slate-400">/mois</span>
        </div>
      </div>

      <ul className="space-y-2.5 mb-6">
        {[
          `${config.scansPerMonth === -1 ? 'Illimités' : config.scansPerMonth} scans OCR / mois`,
          isFree ? 'OCR local Tesseract' : 'Gemini Vision AI (98%)',
          'Export CSV',
          isFree ? null : 'Bot WhatsApp complet',
          isFree ? null : 'Webhooks personnalisés',
          isFree ? null : 'Google Sheets sync',
          `Jusqu'à ${config.maxReceipts === -1 ? '∞' : config.maxReceipts} reçus`,
        ]
          .filter(Boolean)
          .map((feat) => (
            <li key={feat} className="flex items-center gap-2 text-xs text-slate-300">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {feat}
            </li>
          ))}
      </ul>

      {isCurrent ? (
        <div className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold text-center cursor-default">
          Plan actuel
        </div>
      ) : (
        <button
          onClick={onSelect}
          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            popular
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          {isFree ? 'Repasser en Free' : 'Passer à Pro'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
