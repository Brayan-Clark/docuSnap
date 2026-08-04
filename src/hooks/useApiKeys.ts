import { useLocalStorage } from './useLocalStorage';

/**
 * Clés API personnelles de l'utilisateur (stockées en localStorage).
 * Permet à chaque utilisateur d'utiliser SA propre clé Gemini/OpenRouter.
 */
export function useApiKeys() {
  const [geminiKey, setGeminiKey] = useLocalStorage<string>('docusnap.geminiKey.v1', '');
  const [openrouterKey, setOpenrouterKey] = useLocalStorage<string>('docusnap.openrouterKey.v1', '');

  const hasGemini = !!geminiKey;
  const hasOpenrouter = !!openrouterKey;

  /** Retourne la meilleure clé disponible (personnelle > serveur > aucune) */
  const getGeminiKey = (): string => {
    return geminiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  };

  const clearAll = () => {
    setGeminiKey('');
    setOpenrouterKey('');
  };

  return {
    geminiKey, setGeminiKey, hasGemini,
    openrouterKey, setOpenrouterKey, hasOpenrouter,
    getGeminiKey, clearAll,
  };
}
