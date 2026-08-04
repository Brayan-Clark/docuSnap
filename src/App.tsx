import React, { useState, useEffect } from 'react';
import { TabType, ReceiptData } from './types';
import { INITIAL_RECEIPTS } from './data/mockData';
import { useLocalStorage } from './hooks/useLocalStorage';
import { usePlan } from './hooks/usePlan';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ScannerView } from './components/ScannerView';
import { WhatsAppView } from './components/WhatsAppView';
import { IntegrationsView } from './components/IntegrationsView';
import { PricingView } from './components/PricingView';
import { SettingsView } from './components/SettingsView';
import { AuthView } from './components/AuthView';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { Toast } from './components/Toast';

const VALID_TABS: TabType[] = ['dashboard', 'scanner', 'whatsapp', 'integrations', 'pricing', 'settings'];
const initialTab = (() => {
  const param = new URLSearchParams(window.location.search).get('tab');
  if (param && VALID_TABS.includes(param as TabType)) return param as TabType;
  return 'dashboard';
})();

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  // Persistance localStorage : le ledger survit au refresh.
  const [receipts, setReceipts] = useLocalStorage<ReceiptData[]>(
    'docusnap.receipts.v1',
    INITIAL_RECEIPTS
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Système de plans freemium
  const plan = usePlan();

  // Authentification (optionnelle — l'app fonctionne en mode démo sans compte)
  const auth = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAuth, setShowAuth] = useState(false);

  // Quand l'utilisateur se connecte, on sync son plan depuis le serveur
  useEffect(() => {
    if (auth.isLoggedIn && auth.user) {
      plan.setPlanType(auth.user.plan);
    }
  }, [auth.isLoggedIn, auth.user?.plan]);

  // Quand on upgrade/downgrade, on sync aussi côté serveur
  const handleUpgrade = () => {
    plan.upgradeToPro();
    if (auth.isLoggedIn) auth.updatePlan('pro');
  };
  const handleDowngrade = () => {
    plan.downgradeToFree();
    if (auth.isLoggedIn) auth.updatePlan('free');
  };

  // Navigation globale depuis les composants enfants (ex. bouton "Upgrade" dans Scanner)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as TabType;
      if (detail) setActiveTab(detail);
    };
    window.addEventListener('docusnap:navigate', handler);
    return () => window.removeEventListener('docusnap:navigate', handler);
  }, []);

  // Toast trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Add new parsed receipt
  const handleAddParsedReceipt = (newReceipt: ReceiptData) => {
    setReceipts((prev) => [newReceipt, ...prev]);
    setActiveTab('dashboard');
  };

  // Delete receipt
  const handleDeleteReceipt = (id: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    showToast('Receipt deleted from ledger.');
  };

  // Sync receipt to Google Sheets
  const handleSyncToSheets = (receipt: ReceiptData) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === receipt.id ? { ...r, syncedToSheets: true } : r))
    );
    showToast(`✅ Synced "${receipt.merchantName}" to Google Sheets "All Receipts"!`);
  };

  // Export Receipts to CSV
  const handleExportCsv = () => {
    const headers = ['Merchant', 'Invoice No', 'Date', 'Category', 'Subtotal HT', 'VAT Rate', 'VAT Amount', 'Total TTC', 'Payment Method', 'Status'];
    const rows = receipts.map((r) => [
      `"${r.merchantName}"`,
      `"${r.invoiceNumber || ''}"`,
      r.date,
      r.category,
      r.subtotal.toFixed(2),
      `${r.vatRate}%`,
      r.vatAmount.toFixed(2),
      r.totalTTC.toFixed(2),
      `"${r.paymentMethod}"`,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DocuSnap_Expenses_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('📥 Exported Expense Ledger to CSV file!');
  };

  // Total VAT
  const totalVat = receipts.reduce((acc, r) => acc + r.vatAmount, 0);

  // ─── Écran d'authentification (optionnel) ───────────────────────────────
  if (showAuth) {
    return (
      <AuthView
        mode={authMode}
        onToggleMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        onSubmit={authMode === 'login' ? auth.login : auth.register}
        loading={auth.loading}
        error={auth.error}
        onClearError={() => auth.setError(null)}
        onBack={() => setShowAuth(false)}
      />
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        receiptCount={receipts.length}
        totalVat={totalVat}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onQuickScan={() => setActiveTab('scanner')}
        planType={plan.planType}
        onAccountClick={() => setActiveTab('settings')}
        user={auth.user}
        onLogin={() => setShowAuth(true)}
        onLogout={() => { auth.logout(); showToast('Déconnecté.'); }}
      />

      {/* Main Container — hauteur = 100vh − entête ; seule la partie main scroll */}
      <div className="flex-1 min-h-0 flex w-full">
        {/* Sidebar (fixe) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          planType={plan.planType}
          isPro={plan.isPro}
        />

        {/* Dynamic View Viewport — c'est ici que l'on scroll */}
        <main className="flex-1 min-h-0 p-4 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              receipts={receipts}
              onSelectReceipt={(r) => setSelectedReceipt(r)}
              onDeleteReceipt={handleDeleteReceipt}
              onSyncToSheets={handleSyncToSheets}
              setActiveTab={setActiveTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onExportCsv={handleExportCsv}
            />
          )}

          {activeTab === 'scanner' && (
            <ScannerView
              onAddParsedReceipt={handleAddParsedReceipt}
              onSyncToSheets={handleSyncToSheets}
              showToast={showToast}
              canScan={plan.canScan}
              scansRemaining={plan.scansRemaining}
              isPro={plan.isPro}
              incrementUsage={plan.incrementUsage}
            />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppView
              onAddParsedReceipt={handleAddParsedReceipt}
              showToast={showToast}
              isPro={plan.isPro}
              onUpgrade={() => setActiveTab('pricing')}
            />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsView showToast={showToast} isPro={plan.isPro} onUpgrade={() => setActiveTab('pricing')} />
          )}

          {activeTab === 'pricing' && (
            <PricingView
              currentPlan={plan.planType}
              isPro={plan.isPro}
              scansUsed={plan.scansUsed}
              onUpgrade={handleUpgrade}
              onDowngrade={handleDowngrade}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              planType={plan.planType}
              isPro={plan.isPro}
              scansUsed={plan.scansUsed}
              scansRemaining={plan.scansRemaining}
              receiptCount={receipts.length}
              maxReceipts={plan.config.maxReceipts}
              onUpgrade={() => setActiveTab('pricing')}
              onDowngrade={handleDowngrade}
              setActiveTab={setActiveTab}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Detail Inspection Modal */}
      <InvoiceDetailModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        onSyncToSheets={handleSyncToSheets}
        showToast={showToast}
      />

      {/* Floating Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}

export default App;
