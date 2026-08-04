import { useEffect, useState } from 'react';
import { config } from '../config';

export interface EngineStatus {
  activeEngine: 'gemini' | 'tesseract';
  geminiConfigured: boolean;
  models: string[];
  loading: boolean;
}

/**
 * Détecte le moteur OCR actif.
 * Sur GitHub Pages (pas de serveur), utilise la config client directement.
 */
export function useEngineStatus(): EngineStatus {
  const [status, setStatus] = useState<EngineStatus>(() => {
    // Détection immédiate côté client (pas besoin d'attendre le serveur)
    const geminiOk = !!config.geminiApiKey;
    return {
      activeEngine: geminiOk ? 'gemini' : 'tesseract',
      geminiConfigured: geminiOk,
      models: geminiOk ? ['gemini-2.0-flash'] : [],
      loading: false,
    };
  });

  useEffect(() => {
    let cancelled = false;
    // Essayer le serveur pour des infos plus détaillées (optionnel)
    fetch('/api/health', { signal: AbortSignal.timeout(2000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setStatus({
          activeEngine: data.activeEngine === 'gemini' ? 'gemini' : 'tesseract',
          geminiConfigured: !!data.engines?.gemini?.configured,
          models: data.engines?.gemini?.models || [],
          loading: false,
        });
      })
      .catch(() => {
        // Serveur indisponible (GitHub Pages) → garder la détection locale
        if (!cancelled) setStatus((s) => ({ ...s, loading: false }));
      });
    return () => { cancelled = true; };
  }, []);

  return status;
}
