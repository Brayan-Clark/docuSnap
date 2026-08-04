/**
 * DocuSnap AI — Configuration côté client.
 *
 * Les clés API sont injectées AU BUILD par GitHub Actions via les secrets :
 *   VITE_GEMINI_API_KEY, VITE_OPENROUTER_API_KEY, etc.
 *
 * En dev local, on lit .env.local (Vite le charge automatiquement).
 * En production (GitHub Pages), les valeurs viennent du build.
 *
 * ⚠️ Sécurité : ces clés sont visibles dans le bundle JS produit.
 * Pour Gemini : restreindre le domaine dans Google AI Studio.
 * Pour OpenRouter : restreindre l'origine dans les settings du compte.
 */

export const config = {
  // Gemini (gratuit — inscris-toi sur https://aistudio.google.com/apikey)
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || "",

  // OpenRouter (gratuit — inscris-toi sur https://openrouter.ai/keys)
  openrouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY || "",

  // WhatsApp Twilio (PRO — nécessite un serveur, pas pour GitHub Pages)
  twilioConfigured: false, // Toujours false côté client

  // Mode d'exécution
  isStaticBuild: true, // GitHub Pages = pas de serveur backend
} as const;
