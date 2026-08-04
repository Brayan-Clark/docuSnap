import React, { useState } from 'react';
import { ReceiptData } from '../types';
import { 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  Tag, 
  Layers, 
  Code2, 
  Download, 
  Copy, 
  Check, 
  ZoomIn, 
  ExternalLink 
} from 'lucide-react';

interface InvoiceDetailModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
  onSyncToSheets: (receipt: ReceiptData) => void;
  showToast: (msg: string) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  receipt,
  onClose,
  onSyncToSheets,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'json'>('details');
  const [copiedJson, setCopiedJson] = useState(false);

  if (!receipt) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
    setCopiedJson(true);
    showToast('Copied JSON payload to clipboard!');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold font-mono text-sm">
              DS
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {receipt.merchantName}
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({receipt.invoiceNumber || 'NO-REF'})
                </span>
              </h3>
              <p className="text-xs text-slate-400">Scanned on {receipt.uploadedAt}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Tab Toggles */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'details' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Inspection
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                  activeTab === 'json' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> Raw JSON
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        {activeTab === 'details' ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
            {/* Left Image View */}
            <div className="md:col-span-5 space-y-3">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 aspect-[3/4] flex items-center justify-center overflow-hidden relative group">
                <img
                  src={receipt.imageUrl}
                  alt={receipt.merchantName}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={receipt.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-lg"
                  >
                    <ZoomIn className="w-4 h-4 text-cyan-400" /> Open Fullsize
                  </a>
                </div>
              </div>
            </div>

            {/* Right Details Breakdown */}
            <div className="md:col-span-7 space-y-5">
              {/* Top Financial Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-mono">Total Expense (TTC)</span>
                  <div className="text-2xl font-black text-cyan-400 font-mono">
                    {receipt.totalTTC.toFixed(2)} €
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 font-mono">Deductible VAT</span>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    +{receipt.vatAmount.toFixed(2)} € ({receipt.vatRate}%)
                  </div>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-mono block mb-1">Merchant Address</span>
                  <span className="text-slate-200 font-medium">{receipt.merchantAddress || 'N/A'}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-mono block mb-1">VAT / Tax Number</span>
                  <span className="text-slate-200 font-mono font-bold">{receipt.merchantVatNumber || 'N/A'}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-mono block mb-1">Transaction Date</span>
                  <span className="text-slate-200 font-mono font-bold">{receipt.date}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-mono block mb-1">Category & Method</span>
                  <span className="text-slate-200 font-semibold">{receipt.category} • {receipt.paymentMethod}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Extracted Itemized Lines
                </span>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {receipt.lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 text-slate-200">{item.description}</td>
                          <td className="py-2 px-3 text-right text-slate-400">{item.quantity}</td>
                          <td className="py-2 px-3 text-right text-cyan-400 font-bold">{item.totalPrice.toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sheets Sync Action Bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  {receipt.syncedToSheets ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Synced to Google Sheets
                    </span>
                  ) : (
                    <span className="text-slate-400">Ready to append to ledger</span>
                  )}
                </div>

                {!receipt.syncedToSheets && (
                  <button
                    onClick={() => {
                      onSyncToSheets(receipt);
                      showToast('Synced to Google Sheets!');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Sync to Google Sheets
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Raw JSON View */
          <div className="p-6 max-h-[75vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">DocuSnap Structured Gemini Vision JSON</span>
              <button
                onClick={handleCopyJson}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
              {JSON.stringify(receipt, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
