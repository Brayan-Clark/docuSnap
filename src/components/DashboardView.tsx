import React, { useState } from 'react';
import {
  ReceiptData,
  TabType,
  CategoryType,
  InvoiceStatus
} from '../types';
import {
  DollarSign,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Plus,
  Scan,
  Eye,
  Trash2,
  ArrowUpRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Filter
} from 'lucide-react';
import { useEngineStatus } from '../hooks/useEngineStatus';

interface DashboardViewProps {
  receipts: ReceiptData[];
  onSelectReceipt: (receipt: ReceiptData) => void;
  onDeleteReceipt: (id: string) => void;
  onSyncToSheets: (receipt: ReceiptData) => void;
  setActiveTab: (tab: TabType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onExportCsv: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  receipts,
  onSelectReceipt,
  onDeleteReceipt,
  onSyncToSheets,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onExportCsv,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const engine = useEngineStatus();

  // Compute Metrics
  const totalTTC = receipts.reduce((acc, r) => acc + r.totalTTC, 0);
  const totalVat = receipts.reduce((acc, r) => acc + r.vatAmount, 0);
  const verifiedCount = receipts.filter((r) => r.status === 'verified').length;
  const syncedCount = receipts.filter((r) => r.syncedToSheets).length;

  // Category breakdown calculation
  const categoriesList: CategoryType[] = [
    'Hardware',
    'Restaurant',
    'Fuel',
    'Transport',
    'Office',
    'Software',
    'Travel',
    'Services',
  ];

  const categoryTotals = categoriesList.map((cat) => {
    const total = receipts
      .filter((r) => r.category === cat)
      .reduce((acc, r) => acc + r.totalTTC, 0);
    return {
      category: cat,
      total,
      percentage: totalTTC > 0 ? (total / totalTTC) * 100 : 0,
    };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  // Reset demo data (les données sont persistées en localStorage)
  const handleResetDemo = () => {
    if (window.confirm('Réinitialiser toutes les données de démonstration ?')) {
      ['docusnap.receipts.v1', 'docusnap.whatsapp.v1', 'docusnap.integrations.v1', 'docusnap.webhooklogs.v1'].forEach(
        (k) => window.localStorage.removeItem(k)
      );
      window.location.reload();
    }
  };

  // Filtered Receipts
  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.merchantVatNumber && r.merchantVatNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Deductible VAT Card */}
        <div className="bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recoverable VAT
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {totalVat.toFixed(2)} <span className="text-sm font-normal text-slate-400">€</span>
            </div>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
              +100% Tax Deductible
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Ready for Q1 VAT Return Export</p>
        </div>

        {/* Total Expenses TTC */}
        <div className="bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-teal-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Expenses (TTC)
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {totalTTC.toFixed(2)} <span className="text-sm font-normal text-slate-400">€</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {receipts.length} Documents
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Average order: {receipts.length > 0 ? (totalTTC / receipts.length).toFixed(2) : 0}€</p>
        </div>

        {/* Google Sheets Sync Status */}
        <div className="bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sheets Automated Sync
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {syncedCount}/{receipts.length}
            </div>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Connected to DocuSnap_Expenses.xlsx</p>
        </div>

        {/* OCR Speed & Accuracy */}
        <div className="bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              OCR Engine Performance
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {engine.activeEngine === 'gemini' ? '0.8' : '2.1'}<span className="text-sm text-slate-400">s</span>
            </div>
            <span className="text-xs text-cyan-400 font-semibold">
              {engine.activeEngine === 'gemini' ? '98.4%' : '93%'} Accuracy
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {engine.loading
              ? 'Détection du moteur…'
              : engine.activeEngine === 'gemini'
              ? 'Gemini Vision Multimodal'
              : 'OCR local Tesseract (gratuit)'}
          </p>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Scan className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Ready to process a new paper or PDF invoice?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload any receipt image or use our interactive Laser Scanner to extract details in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            onClick={() => setActiveTab('scanner')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Laser Scan Receipt</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp Assistant</span>
          </button>
          <button
            onClick={onExportCsv}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Expense Category Breakdown Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Expense Distribution by Category
            </h3>
            <p className="text-xs text-slate-400">
              Live breakdown of spend across tax deductible categories
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
            Total {totalTTC.toFixed(2)} €
          </span>
        </div>

        {/* Visual Progress Bar Stack */}
        <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
          {categoryTotals.map((cat, idx) => {
            const colors = [
              'bg-cyan-400',
              'bg-teal-400',
              'bg-indigo-400',
              'bg-amber-400',
              'bg-rose-400',
              'bg-emerald-400',
            ];
            return (
              <div
                key={cat.category}
                style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                className={`h-full ${colors[idx % colors.length]} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                title={`${cat.category}: ${cat.total.toFixed(2)} € (${cat.percentage.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Legend Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
          {categoryTotals.map((cat, idx) => {
            const colors = [
              'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
              'text-teal-400 bg-teal-500/10 border-teal-500/20',
              'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
              'text-amber-400 bg-amber-500/10 border-amber-500/20',
              'text-rose-400 bg-rose-500/10 border-rose-500/20',
              'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            ];
            return (
              <div
                key={cat.category}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium ${colors[idx % colors.length]}`}
              >
                <span>{cat.category}</span>
                <span className="font-mono font-bold">{cat.total.toFixed(0)}€</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extracted Receipts History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden space-y-4 p-4 lg:p-6">
        {/* Table Filters & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Parsed Receipts Ledger ({filteredReceipts.length})
            </h3>
            <p className="text-xs text-slate-400">
              All OCR scanned expenses, VAT breakdowns, and Google Sheets sync logs
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Reset Demo Data */}
            <button
              onClick={handleResetDemo}
              title="Réinitialiser les données de démo"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs font-mono uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Merchant & Invoice</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Total TTC</th>
                <th className="py-3 px-4 text-right">VAT Amount</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-center">Sheets Sync</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    No matching receipts found. Try scanning a receipt or clearing filters!
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectReceipt(r)}
                  >
                    {/* Merchant & Invoice */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={r.imageUrl}
                            alt={r.merchantName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                            {r.merchantName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {r.invoiceNumber || 'NO-REF-NUM'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {r.date}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                        {r.category}
                      </span>
                    </td>

                    {/* Total TTC */}
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-white">
                      {r.totalTTC.toFixed(2)} €
                    </td>

                    {/* VAT Amount */}
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-emerald-400 font-semibold">
                      +{r.vatAmount.toFixed(2)} € ({r.vatRate}%)
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          r.confidenceScore >= 95
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : r.confidenceScore >= 80
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {r.confidenceScore}%
                      </span>
                    </td>

                    {/* Sheets Sync */}
                    <td className="py-3.5 px-4 text-center">
                      {r.syncedToSheets ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSyncToSheets(r);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 rounded-full cursor-pointer transition-all"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Sync Now
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectReceipt(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          title="Inspect Invoice Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteReceipt(r.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Receipt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
