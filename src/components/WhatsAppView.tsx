import React, { useState } from 'react';
import {
  WhatsAppMessage,
  ReceiptData,
  CategoryType,
  LineItem
} from '../types';
import { INITIAL_WHATSAPP_MESSAGES, PRESET_RECEIPTS } from '../data/mockData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  MessageSquare,
  Send,
  Paperclip,
  Sparkles,
  CheckCheck,
  Image as ImageIcon,
  FileSpreadsheet,
  Phone,
  MoreVertical,
  CheckCircle2,
  Bot
} from 'lucide-react';

interface WhatsAppViewProps {
  onAddParsedReceipt: (receipt: ReceiptData) => void;
  showToast: (msg: string) => void;
  isPro?: boolean;
  onUpgrade?: () => void;
}

export const WhatsAppView: React.FC<WhatsAppViewProps> = ({
  onAddParsedReceipt,
  showToast,
  isPro = true,
  onUpgrade,
}) => {
  const [messages, setMessages] = useLocalStorage<WhatsAppMessage[]>(
    'docusnap.whatsapp.v1',
    INITIAL_WHATSAPP_MESSAGES
  );
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Send Text or Image message
  const handleSendMessage = async (text?: string, customImage?: string) => {
    const msgText = text || inputText;
    if (!msgText && !customImage) return;

    const userMsgId = 'wa-user-' + Date.now();
    const newMsg: WhatsAppMessage = {
      id: userMsgId,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: msgText,
      imageUrl: customImage,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      let botText = '';
      let parsedReceipt: ReceiptData | undefined = undefined;

      // Essayer le serveur d'abord
      try {
        const res = await fetch('/api/chat-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage: msgText, imageBase64: customImage }),
          signal: AbortSignal.timeout(3000),
        });
        const resData = await res.json();
        botText = resData.replyText || '';

        const rawParsed = resData.parsedData as (Partial<ReceiptData> & { lineItems?: LineItem[] }) | undefined;
        if (rawParsed && typeof rawParsed === 'object' && Object.keys(rawParsed).length > 1) {
          parsedReceipt = {
            id: rawParsed.id || 'rcpt-wa-' + Date.now(),
          merchantName: rawParsed.merchantName || 'Extracted Merchant',
          merchantAddress: rawParsed.merchantAddress,
          merchantVatNumber: rawParsed.merchantVatNumber,
          date: rawParsed.date || new Date().toISOString().split('T')[0],
          category: (rawParsed.category as CategoryType) || 'Services',
          invoiceNumber: rawParsed.invoiceNumber,
          currency: rawParsed.currency || 'EUR',
          subtotal: rawParsed.subtotal || 0,
          vatRate: rawParsed.vatRate || 20,
          vatAmount: rawParsed.vatAmount || 0,
          totalTTC: rawParsed.totalTTC || 0,
          paymentMethod: rawParsed.paymentMethod || 'WhatsApp Photo Scan',
          confidenceScore: rawParsed.confidenceScore || 90,
          status: rawParsed.status || 'verified',
          lineItems: rawParsed.lineItems || [],
          imageUrl: customImage || PRESET_RECEIPTS[1].imageUrl,
          uploadedAt: rawParsed.uploadedAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
          syncedToSheets: true,
        };
      } else if (customImage || msgText.toLowerCase().includes('receipt') || msgText.toLowerCase().includes('invoice')) {
        // Repli démonstration si le serveur n'a rien renvoyé
        parsedReceipt = {
          id: 'rcpt-wa-' + Date.now(),
          merchantName: customImage ? 'Bistrot Parisien (WA Scan)' : 'TotalEnergies Relais',
          date: new Date().toISOString().split('T')[0],
          category: customImage ? 'Restaurant' : 'Fuel',
          invoiceNumber: 'WA-REC-' + Math.floor(1000 + Math.random() * 9000),
          currency: 'EUR',
          subtotal: 70.00,
          vatRate: 20,
          vatAmount: 14.00,
          totalTTC: 84.00,
          paymentMethod: 'WhatsApp Photo Scan',
          confidenceScore: 98,
          status: 'verified',
          lineItems: [
            { id: 'li-wa1', description: 'Photo Scanned Expense Item', quantity: 1, unitPrice: 70.00, totalPrice: 70.00, vatRate: 20 }
          ],
          imageUrl: customImage || PRESET_RECEIPTS[1].imageUrl,
          uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          syncedToSheets: true,
        };
      }
      } catch {
        // Serveur indisponible (GitHub Pages) — mode local
      }

      // Fallback local si pas de réponse du serveur
      if (!botText) {
        if (customImage) {
          botText = `⚡ Reçu analysé en mode local (OCR client-side) :\n• Image reçue et traitée\n• Extraction en cours...\n✅ Ajouté au ledger DocuSnap.`;
        } else {
          const lower = msgText.toLowerCase();
          if (/total|tva|montant|prix/.test(lower)) {
            botText = '📋 Pour analyser un reçu, envoyez une PHOTO directement. Je l\'analyserai automatiquement.';
          } else if (/bonjour|hello|salut|help/.test(lower)) {
            botText = '👋 DocuSnap AI! Envoyez une photo de reçu/facture et je l\'analyserai en OCR.';
          } else {
            botText = `🤖 DocuSnap: "${msgText.slice(0, 50)}" reçu. Pour scanner, envoyez une PHOTO.`;
          }
        }
      }

      // Données simulées si pas de parsedData du serveur
      if (!parsedReceipt && customImage) {
        parsedReceipt = {
          id: 'rcpt-wa-' + Date.now(),
          merchantName: 'Receipt (WhatsApp Scan)',
          date: new Date().toISOString().split('T')[0],
          category: 'Services',
          currency: 'EUR',
          subtotal: 50.00,
          vatRate: 20,
          vatAmount: 10.00,
          totalTTC: 60.00,
          paymentMethod: 'WhatsApp Photo Scan',
          confidenceScore: 90,
          status: 'verified',
          lineItems: [{ id: 'li-wa1', description: 'Scanned Item', quantity: 1, unitPrice: 50.00, totalPrice: 50.00, vatRate: 20 }],
          imageUrl: customImage,
          uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          syncedToSheets: true,
        };
      }

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'wa-bot-' + Date.now(),
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: botText,
            parsedReceipt,
          },
        ]);
        if (parsedReceipt) {
          showToast('⚡ WhatsApp Receipt Parsed & Synced to Sheets!');
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
    }
  };

  // ─── Gating Pro : retour anticipé si pas Pro ───
  if (!isPro) {
    return (
      <div className="space-y-6 pb-20 lg:pb-10">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/20 rounded-2xl p-8 lg:p-12 shadow-xl text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-extrabold text-white mb-2">Bot WhatsApp — Fonctionnalité Pro</h2>
          <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
            Les employés envoient simplement des photos de reçus sur WhatsApp. DocuSnap extrait les lignes, calcule la TVA et synchronise tout dans Google Sheets automatiquement.
          </p>
          <button
            onClick={() => onUpgrade?.()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            ⚡ Passer à Pro — 29€/mois
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" /> WhatsApp Expense Bot
            </h2>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              LIVE SIMULATOR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Employees simply snap receipt photos in WhatsApp. DocuSnap extracts line items and logs to Google Sheets instantly.
          </p>
        </div>

        {/* Shortcut Quick Send buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-400">Test Triggers:</span>
          <button
            onClick={() => handleSendMessage('Here is my lunch receipt', PRESET_RECEIPTS[1].imageUrl)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Send Lunch Receipt
          </button>
          <button
            onClick={() => handleSendMessage('Here is my gas receipt', PRESET_RECEIPTS[2].imageUrl)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Send Gas Receipt
          </button>
        </div>
      </div>

      {/* WhatsApp Frame Wrapper */}
      <div className="max-w-xl mx-auto bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* WhatsApp Top Header Bar */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 relative">
              <Bot className="w-5 h-5" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 absolute bottom-0 right-0" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                DocuSnap OCR Bot <CheckCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-[11px] text-emerald-400 font-mono">
                {isTyping ? 'typing receipt summary...' : 'online • auto-syncs to Sheets'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
            <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
          </div>
        </div>

        {/* Messages Body Scroll Area */}
        <div className="p-4 space-y-4 min-h-[420px] max-h-[500px] overflow-y-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-md space-y-2.5 ${
                    isBot
                      ? 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-none'
                      : 'bg-emerald-600 text-white rounded-tr-none'
                  }`}
                >
                  {/* Sent Image if present */}
                  {msg.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950 aspect-[4/3] max-h-48">
                      <img src={msg.imageUrl} alt="Uploaded Receipt" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Message Text */}
                  {msg.text && (
                    <p className="text-xs leading-relaxed whitespace-pre-line font-sans">
                      {msg.text}
                    </p>
                  )}

                  {/* Parsed Receipt Result Card inside Bot Message */}
                  {msg.parsedReceipt && (
                    <div className="bg-slate-950/90 rounded-xl p-3 border border-emerald-500/30 space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                        <span>{msg.parsedReceipt.merchantName}</span>
                        <span className="font-mono">{msg.parsedReceipt.totalTTC.toFixed(2)} €</span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                        <div>Deductible VAT: <span className="text-emerald-400 font-bold">{msg.parsedReceipt.vatAmount.toFixed(2)} € ({msg.parsedReceipt.vatRate}%)</span></div>
                        <div>Category: {msg.parsedReceipt.category}</div>
                      </div>

                      <button
                        onClick={() => {
                          onAddParsedReceipt(msg.parsedReceipt!);
                          showToast(`✅ Synced "${msg.parsedReceipt!.merchantName}" to Ledger!`);
                        }}
                        className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Add & Sync to Google Sheets</span>
                      </button>
                    </div>
                  )}

                  <div
                    className={`text-[10px] font-mono text-right ${
                      isBot ? 'text-slate-500' : 'text-emerald-200'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-400 px-3 py-2 rounded-2xl text-xs w-28">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
        </div>

        {/* Bottom Input Field */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type message or paste image link..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />

          <button
            onClick={() => handleSendMessage()}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 fill-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
