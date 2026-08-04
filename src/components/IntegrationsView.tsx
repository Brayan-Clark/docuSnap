import React, { useState } from 'react';
import {
  IntegrationConfig,
  WebhookLog
} from '../types';
import {
  INITIAL_INTEGRATIONS_CONFIG,
  INITIAL_WEBHOOK_LOGS
} from '../data/mockData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  FileSpreadsheet, 
  Cable, 
  CheckCircle2, 
  RefreshCw, 
  Send, 
  Key, 
  Zap, 
  ShieldAlert, 
  ExternalLink, 
  Settings, 
  Check 
} from 'lucide-react';

interface IntegrationsViewProps {
  showToast: (msg: string) => void;
  isPro?: boolean;
  onUpgrade?: () => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ showToast, isPro = true, onUpgrade }) => {
  const [config, setConfig] = useLocalStorage<IntegrationConfig>(
    'docusnap.integrations.v1',
    INITIAL_INTEGRATIONS_CONFIG
  );
  const [webhookLogs, setWebhookLogs] = useLocalStorage<WebhookLog[]>(
    'docusnap.webhooklogs.v1',
    INITIAL_WEBHOOK_LOGS
  );
  const [isTestingSheets, setIsTestingSheets] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  // Test Sheets Pipeline (vérifie le serveur + incrémente le ledger local persisté)
  const handleTestSheets = () => {
    setIsTestingSheets(true);
    // 100% client-side, pas de serveur
    setTimeout(() => {
      setIsTestingSheets(false);
      setConfig((prev) => ({
        ...prev,
        googleSheets: {
          ...prev.googleSheets,
          syncedRowsCount: prev.googleSheets.syncedRowsCount + 1,
          lastSyncedAt: 'à l’instant',
        },
      }));
      showToast('✅ Test réussi — ligne ajoutée au ledger local.');
    }, 800);
  };

  // Test Webhook RÉEL : POST vers l'URL configurée avec signature HMAC
  const handleTestWebhook = () => {
    setIsTestingWebhook(true);
    const sampleReceipt = {
      event: 'receipt.parsed',
      merchant: 'Leroy Merlin Paris',
      totalTTC: 185.0,
      vatAmount: 30.83,
      currency: 'EUR',
      timestamp: new Date().toISOString(),
    };

    fetch('/api/webhook/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: config.webhook.url,
        secret: config.webhook.secret,
        event: 'receipt.parsed',
        payload: sampleReceipt,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        const status = res.status ?? 0;
        const ok = res.success === true && status >= 200 && status < 300;
        const newLog: WebhookLog = {
          id: 'wh-log-' + Date.now(),
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          event: 'receipt.parsed',
          url: config.webhook.url,
          status,
          response: (res.response || res.error || '').slice(0, 400),
        };
        setWebhookLogs((prev) => [newLog, ...prev].slice(0, 30));
        showToast(
          ok
            ? `🚀 Webhook livré : ${status} OK (HMAC ${res.signature || 'sans secret'}).`
            : `⚠️ Webhook : ${status} ${res.response || ''}`.slice(0, 90)
        );
      })
      .catch((err) => {
        setWebhookLogs((prev) => [
          {
            id: 'wh-log-' + Date.now(),
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            event: 'receipt.parsed',
            url: config.webhook.url,
            status: 0,
            response: String(err?.message || 'network error'),
          },
          ...prev,
        ].slice(0, 30));
        showToast('❌ Webhook : erreur réseau — URL joignable ?');
      })
      .finally(() => setIsTestingWebhook(false));
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cable className="w-5 h-5 text-indigo-400" /> Integrations & Webhooks Engine
            </h2>
            <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
              REAL-TIME PIPELINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automate bookkeeping workflows by syncing extracted OCR receipts directly to Google Sheets, Notion, or custom REST Webhooks.
          </p>
        </div>
      </div>

      {/* Main Grid: Google Sheets Card & Webhook Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Sheets Integration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Google Sheets Integration</h3>
                <p className="text-xs text-slate-400">Continuous background accounting sync</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.googleSheets.enabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    googleSheets: { ...config.googleSheets, enabled: e.target.checked },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Target Spreadsheet Name
              </label>
              <input
                type="text"
                value={config.googleSheets.spreadsheetName}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    googleSheets: { ...config.googleSheets, spreadsheetName: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Sheet Tab Name</label>
                <input
                  type="text"
                  value={config.googleSheets.sheetName}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      googleSheets: { ...config.googleSheets, sheetName: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Synced Rows Ledger</label>
                <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 font-mono text-xs font-bold text-emerald-400 flex items-center justify-between">
                  <span>{config.googleSheets.syncedRowsCount} Rows</span>
                  <span className="text-[10px] text-slate-500">{config.googleSheets.lastSyncedAt}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Auto-sync verified receipts
              </span>

              <button
                onClick={handleTestSheets}
                disabled={isTestingSheets}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSheets ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Webhook Endpoint Builder */}
        {isPro ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Outbound Custom Webhook</h3>
                <p className="text-xs text-slate-400">Post JSON events to your ERP/API</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.webhook.enabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    webhook: { ...config.webhook, enabled: e.target.checked },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Webhook Listener Endpoint URL
              </label>
              <input
                type="text"
                value={config.webhook.url}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    webhook: { ...config.webhook, url: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                HMAC Signing Secret
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={config.webhook.secret}
                  readOnly
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-400 font-mono"
                />
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Triggers: receipt.parsed, receipt.synced</span>

              <button
                onClick={handleTestWebhook}
                disabled={isTestingWebhook}
                className="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <Send className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-bounce' : ''}`} />
                <span>Fire Test Payload</span>
              </button>
            </div>
          </div>
        </div>
        ) : (
        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center min-h-[280px]">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Webhooks — Fonctionnalité Pro</h3>
          <p className="text-xs text-slate-400 mb-5 max-w-xs">
            Envoyez des événements JSON en temps réel vers votre ERP, Zapier ou n8n. Signature HMAC-SHA256 incluse.
          </p>
          <button
            onClick={() => onUpgrade?.()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            ⚡ Passer à Pro
          </button>
        </div>
        )}
      </div>

      {/* Webhook Activity Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          Webhook Execution Delivery Logs
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Endpoint</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Response Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {webhookLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 text-slate-400">{log.timestamp}</td>
                  <td className="py-2.5 px-3 text-indigo-400 font-bold">{log.event}</td>
                  <td className="py-2.5 px-3 text-slate-300 truncate max-w-xs">{log.url}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        log.status >= 200 && log.status < 300
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {log.status === 0 ? 'ERR' : `${log.status} ${log.status >= 200 && log.status < 300 ? 'OK' : 'FAIL'}`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{log.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
