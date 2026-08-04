import React from 'react';
import { LayoutDashboard, ScanLine, MessageSquare, Cable, ShieldCheck, ArrowUpRight, Zap, Crown, Settings } from 'lucide-react';
import { TabType, PlanType } from '../types';
import { useEngineStatus } from '../hooks/useEngineStatus';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingCount?: number;
  planType?: PlanType;
  isPro?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, pendingCount = 0, planType, isPro }) => {
  const engine = useEngineStatus();
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'scanner' as TabType,
      label: 'AI Laser Scanner',
      icon: ScanLine,
      badge: 'LIVE OCR',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'whatsapp' as TabType,
      label: 'WhatsApp Bot',
      icon: MessageSquare,
      badge: isPro ? 'PRO' : 'PRO',
      badgeColor: isPro ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-700/50 text-slate-400 border-slate-600',
    },
    {
      id: 'integrations' as TabType,
      label: 'Sheets & Webhooks',
      icon: Cable,
      badge: 'ACTIVE',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'pricing' as TabType,
      label: 'Pricing & Plans',
      icon: Crown,
      badge: planType === 'pro' ? 'PRO' : 'UPGRADE',
      badgeColor: planType === 'pro' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'settings' as TabType,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Desktop Navigation Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 shrink-0 justify-between h-full min-h-0 sticky top-0">
        <div className="space-y-6">
          <div className="px-3 py-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Platform Menu
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-cyan-400 font-semibold border border-slate-700/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Connected Status Card */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Pipeline Status</span>
            </div>
            <span className={`w-2 h-2 rounded-full ${engine.loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {engine.loading
              ? 'Vérification du moteur…'
              : engine.activeEngine === 'gemini'
              ? 'Gemini Vision connecté. Google Sheets sync queue active.'
              : 'OCR local Tesseract actif (100% gratuit, sans clé). Google Sheets sync queue active.'}
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Moteur OCR</span>
            <span className={`flex items-center gap-1 font-semibold ${engine.activeEngine === 'gemini' ? 'text-cyan-400' : 'text-emerald-400'}`}>
              <Zap className="w-3 h-3" />
              {engine.loading ? '…' : engine.activeEngine === 'gemini' ? 'Gemini Vision' : 'Tesseract'}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Sticky Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive ? 'text-cyan-400 bg-slate-800/80' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
