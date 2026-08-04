import { config } from '../config';

export interface EngineStatus {
  activeEngine: 'gemini' | 'tesseract';
  geminiConfigured: boolean;
  models: string[];
  loading: boolean;
}

/**
 * Détecte le moteur OCR — 100% client-side, AUCUN appel serveur.
 */
export function useEngineStatus(): EngineStatus {
  const geminiOk = !!config.geminiApiKey;
  return {
    activeEngine: geminiOk ? 'gemini' : 'tesseract',
    geminiConfigured: geminiOk,
    models: geminiOk ? ['gemini-2.0-flash'] : [],
    loading: false,
  };
}
