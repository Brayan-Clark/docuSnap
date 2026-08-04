import React from 'react';
import { Scan, Sparkles, FileSpreadsheet, Zap, CheckCircle2, Search, Bell, Settings, LogIn, LogOut, User } from 'lucide-react';
import { TabType, PlanType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  receiptCount: number;
  totalVat: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onQuickScan: () => void;
  planType?: PlanType;
  onAccountClick?: () => void;
  user?: { id: string; email: string; plan: string } | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  receiptCount,
  totalVat,
  searchQuery,
  setSearchQuery,
  onQuickScan,
  planType,
  onAccountClick,
  user,
  onLogin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left branding / Title */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Scan className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  Docu<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">Snap AI</span>
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Sparkles className="w-3 h-3" /> PRO OCR
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Automated B2B Expense OCR & Google Sheets Live Pipeline
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge for Mobile */}
          <div className="md:hidden flex items-center gap-2 text-xs font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-emerald-400 font-semibold">{totalVat.toFixed(0)}€</span>
            <span className="text-slate-400">VAT</span>
          </div>
        </div>

        {/* Center Search bar when on Dashboard */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search merchant, invoice #, VAT number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Status Indicators & Action */}
        <div className="flex items-center gap-3 justify-end">
          {/* Plan Badge */}
          {planType === 'pro' && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/30">
              <Zap className="w-3 h-3" /> PRO
            </span>
          )}

          {/* Live Pipeline Badge */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Sheets Sync: <strong className="text-white font-mono">{receiptCount} Items</strong></span>
          </div>

          {/* User / Auth */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 font-medium max-w-[120px] truncate">{user.email}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>
          )}

          {/* Settings */}
          {onAccountClick && (
            <button
              onClick={onAccountClick}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Paramètres"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Quick Scan Button */}
          <button
            onClick={() => {
              setActiveTab('scanner');
              onQuickScan();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Scan Receipt</span>
          </button>
        </div>
      </div>
    </header>
  );
};
