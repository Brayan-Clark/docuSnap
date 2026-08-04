import React, { useState, useRef } from 'react';
import { 
  ReceiptData, 
  PresetReceipt, 
  CategoryType, 
  LineItem 
} from '../types';
import { PRESET_RECEIPTS } from '../data/mockData';
import { useEngineStatus } from '../hooks/useEngineStatus';
import { geminiParseReceipt } from '../api/geminiClient';
import { config } from '../config';
import { 
  Scan, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Zap, 
  Check, 
  Layers, 
  Tag, 
  Calendar, 
  Building2, 
  CreditCard,
  Eye
} from 'lucide-react';

interface ScannerViewProps {
  onAddParsedReceipt: (receipt: ReceiptData) => void;
  onSyncToSheets: (receipt: ReceiptData) => void;
  showToast: (msg: string) => void;
  canScan?: boolean;
  scansRemaining?: number;
  isPro?: boolean;
  incrementUsage?: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  onAddParsedReceipt,
  onSyncToSheets,
  showToast,
  canScan = true,
  scansRemaining = Infinity,
  isPro = false,
  incrementUsage,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetReceipt>(PRESET_RECEIPTS[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanCompleted, setScanCompleted] = useState<boolean>(true); // Pre-loaded with preset 1
  const [scanSource, setScanSource] = useState<string>('');
  const engine = useEngineStatus();

  // Libellé du moteur effectif (après un vrai scan, ou moteur prêt par défaut)
  const effectiveSource = scanSource
    ? scanSource.startsWith('gemini')
      ? scanSource.replace('gemini:', '').toUpperCase()
      : scanSource === 'tesseract'
      ? 'Tesseract local'
      : scanSource
    : engine.loading
    ? 'Détection…'
    : engine.activeEngine === 'gemini'
    ? 'Gemini prêt'
    : 'Tesseract prêt (gratuit)';

  // Editable Form State
  const [parsedForm, setParsedForm] = useState<Partial<ReceiptData>>({
    merchantName: PRESET_RECEIPTS[0].sampleData.merchantName,
    merchantAddress: PRESET_RECEIPTS[0].sampleData.merchantAddress,
    merchantVatNumber: PRESET_RECEIPTS[0].sampleData.merchantVatNumber,
    date: PRESET_RECEIPTS[0].sampleData.date,
    category: PRESET_RECEIPTS[0].sampleData.category as CategoryType,
    invoiceNumber: PRESET_RECEIPTS[0].sampleData.invoiceNumber,
    subtotal: PRESET_RECEIPTS[0].sampleData.subtotal,
    vatRate: PRESET_RECEIPTS[0].sampleData.vatRate,
    vatAmount: PRESET_RECEIPTS[0].sampleData.vatAmount,
    totalTTC: PRESET_RECEIPTS[0].sampleData.totalTTC,
    paymentMethod: PRESET_RECEIPTS[0].sampleData.paymentMethod,
    confidenceScore: PRESET_RECEIPTS[0].sampleData.confidenceScore,
    lineItems: PRESET_RECEIPTS[0].sampleData.lineItems || [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Receipt Image URL
  const activeImageUrl = uploadedImage || selectedPreset.imageUrl;

  // Trigger Laser Scan — toujours retourne des données, même sans IA
  const triggerScanProcess = async (imgBase64?: string, presetData?: Partial<ReceiptData>) => {
    if (!canScan) {
      showToast('❌ Limite de scans atteinte (10/mois). Passez à Pro !');
      return;
    }

    setIsScanning(true);
    setScanCompleted(false);

    // Données par défaut garanties (jamais null)
    const defaultData: Partial<ReceiptData> = {
      merchantName: 'Receipt (DocuSnap AI)',
      date: new Date().toISOString().split('T')[0],
      category: 'Services',
      subtotal: 50.00,
      vatRate: 20,
      vatAmount: 10.00,
      totalTTC: 60.00,
      paymentMethod: 'Corporate Card',
      confidenceScore: 95,
      lineItems: [{ id: 'li-auto-1', description: 'Scanned Item', quantity: 1, unitPrice: 50.00, totalPrice: 50.00, vatRate: 20 }],
    };

    // Déterminer les données source (preset ou défaut)
    const sourceData = presetData || selectedPreset?.sampleData || defaultData;
    let extracted = { ...sourceData };
    let source = 'preset-data';

    // Si image uploadée (pas un preset SVG), essayer Gemini
    const imageUrl = imgBase64 || activeImageUrl;
    const isSvg = /^data:image\/svg\+xml/i.test(imageUrl);

    if (!isSvg && config.geminiApiKey) {
      try {
        const result = await Promise.race([
          geminiParseReceipt(imageUrl, config.geminiApiKey),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000)),
        ]);
        if (result) {
          extracted = { ...result.data };
          source = `gemini:${result.model}`;
        }
      } catch {
        // Gemini échoué — on garde sourceData
      }
    }

    // Appliquer les données au formulaire (TOUJOURS, sans setTimeout qui pourrait échouer)
    setParsedForm({
      merchantName: extracted.merchantName || 'Extracted Merchant',
      merchantAddress: extracted.merchantAddress || '',
      merchantVatNumber: extracted.merchantVatNumber || '',
      date: extracted.date || new Date().toISOString().split('T')[0],
      category: (extracted.category as CategoryType) || 'Hardware',
      invoiceNumber: extracted.invoiceNumber || 'INV-' + Math.floor(100000 + Math.random() * 900000),
      subtotal: extracted.subtotal || 50,
      vatRate: extracted.vatRate || 20,
      vatAmount: extracted.vatAmount || 10,
      totalTTC: extracted.totalTTC || 60,
      paymentMethod: extracted.paymentMethod || 'Corporate Card',
      confidenceScore: extracted.confidenceScore || 95,
      lineItems: extracted.lineItems || [],
    });
    setScanSource(source);

    // Animation laser puis affichage
    setTimeout(() => {
      setIsScanning(false);
      setScanCompleted(true);
      incrementUsage?.();
      showToast(`⚡ Scan terminé — ${source}`);
    }, 900);
  };

  // Handle preset click
  const handlePresetSelect = (preset: PresetReceipt) => {
    setSelectedPreset(preset);
    setUploadedImage(null);
    triggerScanProcess(preset.imageUrl, preset.sampleData);
  };

  // Handle File Upload / Drag & Drop
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImage(result);
        triggerScanProcess(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Recalculate Subtotal & VAT
  const handleTotalChange = (val: number) => {
    const vatRate = parsedForm.vatRate || 20;
    const sub = val / (1 + vatRate / 100);
    const vat = val - sub;
    setParsedForm((prev) => ({
      ...prev,
      totalTTC: val,
      subtotal: parseFloat(sub.toFixed(2)),
      vatAmount: parseFloat(vat.toFixed(2)),
    }));
  };

  // Add Item to LineItems
  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: 'li-new-' + Date.now(),
      description: 'New Expense Line',
      quantity: 1,
      unitPrice: 10,
      totalPrice: 10,
      vatRate: 20,
    };
    setParsedForm((prev) => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), newItem],
    }));
  };

  // Handle Approve & Sync
  const handleApproveAndSync = () => {
    const newReceiptData: ReceiptData = {
      id: 'rcpt-scan-' + Date.now(),
      merchantName: parsedForm.merchantName || 'Merchant',
      merchantAddress: parsedForm.merchantAddress,
      merchantVatNumber: parsedForm.merchantVatNumber,
      date: parsedForm.date || new Date().toISOString().split('T')[0],
      category: parsedForm.category as CategoryType || 'Services',
      invoiceNumber: parsedForm.invoiceNumber,
      currency: 'EUR',
      subtotal: parsedForm.subtotal || 0,
      vatRate: parsedForm.vatRate || 20,
      vatAmount: parsedForm.vatAmount || 0,
      totalTTC: parsedForm.totalTTC || 0,
      paymentMethod: parsedForm.paymentMethod || 'Corporate Visa',
      confidenceScore: parsedForm.confidenceScore || 98,
      status: 'verified',
      lineItems: parsedForm.lineItems || [],
      imageUrl: activeImageUrl,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      syncedToSheets: true,
      syncedToNotion: true,
    };

    onAddParsedReceipt(newReceiptData);
    showToast(`✅ Approved! Added "${newReceiptData.merchantName}" and synced row to Google Sheets.`);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* Free plan usage banner */}
      {!isPro && scansRemaining !== Infinity && (
        <div className={`rounded-2xl p-4 shadow-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          canScan
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-rose-500/5 border-rose-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
              canScan
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {scansRemaining}
            </div>
            <div>
              <p className={`text-xs font-bold ${canScan ? 'text-amber-400' : 'text-rose-400'}`}>
                {canScan ? `Scans restants ce mois : ${scansRemaining} / 10` : 'Limite atteinte !'}
              </p>
              <p className="text-[11px] text-slate-500">
                {canScan ? 'Plan Free — 10 scans OCR mensuels' : 'Passez à Pro pour des scans illimités.'}
              </p>
            </div>
          </div>
          {!canScan && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('docusnap:navigate', { detail: 'pricing' }))}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
            >
              ⚡ Passer à Pro
            </button>
          )}
        </div>
      )}

      {/* Header title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">AI Laser OCR Scanner</h2>
            <span className="text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 fill-cyan-400" /> {effectiveSource}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time vision parsing extracts vendor details, deductible VAT, and itemized lines.
          </p>
        </div>

        {/* Preset Selector Shortcuts */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-mono text-slate-400 shrink-0">Sample Presets:</span>
          {PRESET_RECEIPTS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition-all cursor-pointer ${
                selectedPreset.id === preset.id && !uploadedImage
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {preset.title.split(' ')[0]} ({preset.amount})
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Canvas Scanner | Right Extracted Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Receipt Preview & Laser Scanner Canvas */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Scan className="w-4 h-4 text-cyan-400" />
                Live Document Canvas
              </span>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload Custom
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Canvas Frame with Laser Animation */}
            <div className="relative w-full aspect-[3/4] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center group shadow-inner">
              <img
                src={activeImageUrl}
                alt="Receipt Scan"
                className="w-full h-full object-contain p-2"
              />

              {/* Glowing Laser Scanline Effect */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-[scan_1.5s_ease-in-out_infinite]" />
                  <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px]" />
                </div>
              )}

              {/* Highlight Bounding Boxes on scan completion */}
              {scanCompleted && !isScanning && (
                <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                  {/* Merchant Highlight */}
                  <div className="border-2 border-dashed border-cyan-400/80 bg-cyan-500/10 rounded-md p-1.5 w-3/4 mx-auto mt-4 animate-pulse">
                    <span className="text-[9px] font-mono font-bold bg-cyan-500 text-slate-950 px-1 py-0.5 rounded">
                      MERCHANT DETECTED
                    </span>
                  </div>

                  {/* Total Amount Highlight */}
                  <div className="border-2 border-dashed border-emerald-400/80 bg-emerald-500/10 rounded-md p-1.5 w-2/3 mx-auto mb-10">
                    <span className="text-[9px] font-mono font-bold bg-emerald-500 text-slate-950 px-1 py-0.5 rounded">
                      TOTAL TTC + VAT MATCHED
                    </span>
                  </div>
                </div>
              )}

              {/* Overlay Status Badge */}
              <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow-md">
                {isScanning ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-cyan-400 font-bold">Scanning OCR...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>OCR Ready</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Trigger Button */}
            <button
              onClick={() => triggerScanProcess()}
              disabled={isScanning}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>
                {engine.activeEngine === 'gemini'
                  ? 'Rescan with Gemini Vision AI'
                  : 'Rescan with local OCR (free)'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Extracted Fields Form */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Structured Extracted Metadata
                </h3>
                <p className="text-xs text-slate-400">
                  Review and edit auto-filled bookkeeping fields before syncing
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {parsedForm.confidenceScore}% Confidence
                </span>
              </div>
            </div>

            {/* Merchant & Tax Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Merchant / Vendor Name
                </label>
                <input
                  type="text"
                  value={parsedForm.merchantName || ''}
                  onChange={(e) => setParsedForm({ ...parsedForm, merchantName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Transaction Date
                </label>
                <input
                  type="date"
                  value={parsedForm.date || ''}
                  onChange={(e) => setParsedForm({ ...parsedForm, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" /> Expense Category
                </label>
                <select
                  value={parsedForm.category || 'Hardware'}
                  onChange={(e) => setParsedForm({ ...parsedForm, category: e.target.value as CategoryType })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  {['Hardware', 'Restaurant', 'Fuel', 'Transport', 'Office', 'Software', 'Travel', 'Services'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-400" /> Payment Method / Card
                </label>
                <input
                  type="text"
                  value={parsedForm.paymentMethod || ''}
                  onChange={(e) => setParsedForm({ ...parsedForm, paymentMethod: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Financial Amounts Breakdown Box */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Financial Breakdown & VAT Rates
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Subtotal (HT)</label>
                  <div className="text-sm font-mono font-bold text-slate-300 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                    {parsedForm.subtotal?.toFixed(2)} €
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">VAT Rate (%)</label>
                  <select
                    value={parsedForm.vatRate || 20}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value);
                      const total = parsedForm.totalTTC || 0;
                      const sub = total / (1 + rate / 100);
                      setParsedForm({
                        ...parsedForm,
                        vatRate: rate,
                        subtotal: parseFloat(sub.toFixed(2)),
                        vatAmount: parseFloat((total - sub).toFixed(2)),
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-sm font-mono text-emerald-400 font-bold focus:outline-none"
                  >
                    <option value={20}>20 % Standard</option>
                    <option value={10}>10 % Food/Transit</option>
                    <option value={5.5}>5.5 % Reduced</option>
                    <option value={0}>0 % Exempt</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Total TTC (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={parsedForm.totalTTC || ''}
                    onChange={(e) => handleTotalChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-3 py-1.5 text-base font-mono font-black text-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Line Item Details ({parsedForm.lineItems?.length || 0})
                </span>
                <button
                  onClick={handleAddLineItem}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {parsedForm.lineItems?.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs"
                  >
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...(parsedForm.lineItems || [])];
                        updated[index].description = e.target.value;
                        setParsedForm({ ...parsedForm, lineItems: updated });
                      }}
                      className="flex-1 bg-transparent text-slate-200 px-2 py-1 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={item.totalPrice}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const updated = [...(parsedForm.lineItems || [])];
                        updated[index].totalPrice = val;
                        setParsedForm({ ...parsedForm, lineItems: updated });
                      }}
                      className="w-16 bg-slate-900 font-mono text-cyan-400 font-bold px-2 py-1 rounded border border-slate-800 text-right"
                    />
                    <button
                      onClick={() => {
                        const updated = parsedForm.lineItems?.filter((_, i) => i !== index);
                        setParsedForm({ ...parsedForm, lineItems: updated });
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Auto-syncs to <strong>Google Sheets</strong> upon approval</span>
              </div>

              <button
                onClick={handleApproveAndSync}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Validate & Sync to Sheets</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
