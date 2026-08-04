<div align="center">
  <h1>🖨️ DocuSnap AI</h1>
  <p><b>OCR intelligent de reçus & factures B2B — 100% opérationnel, même sans clé API.</b></p>
  <p>Scan laser, WhatsApp bot, ledger de dépenses, synchro Google Sheets & webhooks.</p>
</div>

---

## ✨ Fonctionnalités

| Module | Description |
|--------|-------------|
| **Dashboard** | KPIs (TVA déductible, total TTC, synchro Sheets, perf OCR), répartition par catégorie, ledger de reçus filtrable, export CSV |
| **Scanner Laser** | OCR temps réel : extraction marchand, TVA, lignes détaillées, montants. Upload photo ou presets de démo |
| **WhatsApp Bot** | Simulation live : envoie un reçu → analyse OCR réelle → carte récapitulative → ajout au ledger |
| **Intégrations** | Webhooks réels (POST + signature HMAC-SHA256), journal de livraison |

## 🧠 Moteurs IA — zéro clé requise

| Moteur | Gratuit | Précision | Usage |
|--------|---------|-----------|-------|
| **Gemini Vision** | ✅ (Google AI Studio) | ~98% | Photos réelles |
| **Tesseract local** | ✅ (aucune inscription) | ~93% | Toujours disponible |
| **OpenRouter** | ✅ (inscription 30s) | ~95% | Fallback |

## 🚀 Démarrage

```bash
npm install
npm run dev        # http://localhost:3000
```

### Compte de test Pro
- **Email** : `admin@docusnap.ai`
- **Mot de passe** : `Pro2025!`

## 🌐 Déploiement GitHub Pages

```bash
# 1. Push le code
git push origin main

# 2. Configurer les secrets GitHub :
#    Settings → Secrets → Actions → New secret
#    VITE_GEMINI_API_KEY=AIza...

# 3. Activer GitHub Pages :
#    Settings → Pages → Source: GitHub Actions
```

📖 **Guide complet** : [DEPLOYMENT.md](DEPLOYMENT.md)

## 📦 Production

```bash
npm run build      # bundle front + serveur
npm start          # http://localhost:3000
```

## 🏗️ Architecture

- **Front** : React 19 + Vite + Tailwind (composants dans `src/components/`)
- **Back** : Express (`server.ts`) + moteur OCR (`server/ocrParser.ts`)
- **Persistance** : hook `useLocalStorage` (`src/hooks/`)
- **CI/CD** : GitHub Actions → GitHub Pages

## 📄 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) — Guide de déploiement complet (setup, WhatsApp, webhooks, architecture, FAQ)
