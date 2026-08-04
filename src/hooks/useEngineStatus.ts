import { useEffect, useState } from 'react';

export interface EngineStatus {
  activeEngine: 'gemini' | 'tesseract';
  geminiConfigured: boolean;
  models: string[];
  loading: boolean;
}

/** Interroge /api/health pour connaître le moteur OCR réellement actif. */
export function useEngineStatus(): EngineStatus {
  const [status, setStatus] = useState<EngineStatus>({
    activeEngine: 'tesseract',
    geminiConfigured: false,
    models: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setStatus({
            activeEngine: data.activeEngine === 'gemini' ? 'gemini' : 'tesseract',
            geminiConfigured: !!data.engines?.gemini?.configured,
            models: data.engines?.gemini?.models || [],
            loading: false,
          });
        } else {
          setStatus((s) => ({ ...s, loading: false }));
        }
      })
      .catch(() => {
        if (!cancelled) setStatus((s) => ({ ...s, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
