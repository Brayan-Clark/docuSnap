# 🚀 DocuSnap AI — Guide de déploiement complet

> Guide pas-à-pas pour déployer, configurer et utiliser DocuSnap AI.

---

## 📋 Table des matières

1. [Aperçu du projet](#1-apercu-du-projet)
2. [Démarrage rapide (dev local)](#2-demarrage-rapide)
3. [Déploiement GitHub Pages](#3-deploiement-github-pages)
4. [Configuration des clés API](#4-configuration-des-cles-api)
5. [Système d'authentification](#5-systeme-dauthentification)
6. [WhatsApp Business (Twilio)](#6-whatsapp-business-twilio)
7. [Webhooks personnalisés](#7-webhooks-personnalises)
8. [Architecture technique](#8-architecture-technique)
9. [Freemium & Pricing](#9-freemium--pricing)
10. [FAQ & Dépannage](#10-faq--depannage)

---

## 1. Aperçu du projet

DocuSnap AI est une application SaaS d'**OCR intelligent pour reçus et factures B2B**.

### Fonctionnalités principales
- 📸 **Scanner OCR** : analyse de photos de reçus/factures via IA
- 📊 **Dashboard** : KPIs temps réel (TVA déductible, total TTC, répartition catégories)
- 📱 **WhatsApp Bot** : analyse de reçus par photo WhatsApp (Twilio)
- 🔗 **Webhooks** : notification temps réel vers ERP/Zapier/n8n
- 📥 **Export CSV** : export complet du ledger de dépenses
- 🔐 **Comptes utilisateurs** : inscription, connexion, plans Free/Pro

### Stack technique
| Composant | Technologie |
|-----------|------------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Express (optionnel — l'app fonctionne sans serveur) |
| OCR | Gemini Vision API (gratuit) / Tesseract.js (local) |
| Auth | JWT (optionnel) / localStorage (GitHub Pages) |
| Déploiement | GitHub Pages (statique) / Serveur Node (production) |

---

## 2. Démarrage rapide

### Prérequis
- Node.js 20+
- npm

### Installation
```bash
# Cloner le repository
git clone https://github.com/Brayan-Clark/docuSnap.git
cd docuSnap

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
# → http://localhost:3000
```

### Compte de test Pro
| Champ | Valeur |
|-------|--------|
| Email | `admin@docusnap.ai` |
| Mot de passe | `Pro2025!` |
| Plan | Pro (actif) |

---

## 3. Déploiement GitHub Pages

### Étape 1 : Push le code
```bash
git remote add origin https://github.com/Brayan-Clark/docuSnap.git
git add .
git commit -m "feat: initial DocuSnap AI deployment"
git push -u origin main
```

### Étape 2 : Configurer les Secrets GitHub
1. Va sur ton repo → **Settings** → **Secrets and variables** → **Actions**
2. Clique **New repository secret**
3. Ajoute :
   - `VITE_GEMINI_API_KEY` → ta clé Gemini (voir section4)
   - `VITE_OPENROUTER_API_KEY` → (optionnel) ta clé OpenRouter

### Étape 3 : Activer GitHub Pages
1. **Settings** → **Pages**
2. Source : **GitHub Actions**
3. Le workflow se lance automatiquement sur chaque push

### Étape 4 : Restreindre la clé Gemini
1. Va sur https://aistudio.google.com/apikey
2. Clique sur ta clé
3. Dans **HTTP referrer**, ajoute : `https://brayan-clark.github.io/*`
4. Sauvegarde

### Variables d'environnement GitHub Actions

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `VITE_GEMINI_API_KEY` | Clé API Google Gemini (gratuite) | Recommandé |
| `VITE_OPENROUTER_API_KEY` | Clé API OpenRouter (gratuite) | Optionnel |

---

## 4. Configuration des clés API

### 🔑 Gemini (Google) — Recommandé

**C'est la meilleure option gratuite pour l'OCR.**

1. Va sur https://aistudio.google.com/apikey
2. Connecte-toi avec ton compte Google (gratuit)
3. Clique **Create API Key**
4. Sélectionne ou crée un projet
5. Copie la clé (commence par `AIza...`)

**Quota gratuit :**
- 1500 requêtes/jour
- 15 requêtes/minute
- Modèles : gemini-2.0-flash, gemini-2.5-flash
- Coût : 0€, pas de CB

**Pour GitHub Pages :**
- Ajoute `VITE_GEMINI_API_KEY=AIza...` dans les secrets GitHub
- OU laisse l'utilisateur entrer sa propre clé dans Settings

**Pour le serveur local :**
```bash
# Dans .env
GEMINI_API_KEY="AIza..."
```

### 🔑 OpenRouter — Optionnel

1. Va sur https://openrouter.ai/keys
2. Crée un compte gratuit
3. Génère une clé API
4. Ajoute-la dans les secrets GitHub : `VITE_OPENROUTER_API_KEY`

⚠️ Les modèles gratuits OpenRouter sont lents (30-60s). Utilisé comme fallback uniquement.

### 🔑 Tesseract — Toujours disponible

Aucune clé requise. OCR local via WebAssembly. Précision ~93%.
Utilisé automatiquement quand aucune clé IA n'est configurée.

---

## 5. Système d'authentification

### Mode GitHub Pages (sans serveur)
- Les comptes sont stockés en **localStorage** du navigateur
- Pas de JWT, pas de base de données
- Fonctionne totalement hors ligne
- ⚠️ Les données disparaissent si l'utilisateur vide son navigateur

### Mode Serveur (production)
- Comptes stockés dans `data/users.json`
- Authentification JWT (tokens signés)
- Sessions de30 jours

### Endpoints d'auth (mode serveur)

| Méthode | Endpoint | Rôle |
|---------|----------|------|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter |
| GET | `/api/auth/me` | Profil utilisateur |
| PUT | `/api/auth/plan` | Changer de plan |

### Exemple d'inscription (curl)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"MonMdp123"}'
```

---

## 6. WhatsApp Business (Twilio)

### Comment ça marche

```
Utilisateur → envoie photo à TON numéro Twilio (+33 6 XX XX XX XX)
    ↓
Twilio reçoit → forward vers TON webhook
    ↓
Serveur analyse (OCR) → répond via Twilio API
    ↓
L'utilisateur reçoit la réponse sur SON WhatsApp
```

**L'utilisateur n'a PAS besoin de WhatsApp Business.** Il envoie juste un message à ton numéro Twilio.

### Prérequis
1. **Compte Twilio** : https://www.twilio.com (free trial disponible)
2. **Numéro Twilio** : achète un numéro (~1$/mois) avec WhatsApp activé
3. **Numéro WhatsApp sandbox** : Twilio fournit un numéro sandbox pour les tests

### Configuration

#### Étape1 : Activer WhatsApp sur Twilio
1. Va sur https://console.twilio.com
2. **Messaging** → **Try WhatsApp**
3. Envoie le message de test au numéro sandbox Twilio

#### Étape2 : Configurer le webhook
1. **Messaging** → **Settings** → **WhatsApp sandbox configuration**
2. **When a message comes in** : `POST`
3. **URL** : `https://ton-domaine.com/api/whatsapp/webhook`
4. Sauvegarde

#### Étape3 : Variables d'environnement
```bash
# Dans .env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"  # Numéro sandbox Twilio
```

### Endpoints WhatsApp

| Méthode | Endpoint | Rôle |
|---------|----------|------|
| POST | `/api/whatsapp/webhook` | Reçoit les messages (Twilio) |
| POST | `/api/whatsapp/send` | Envoie un message |

### Test du webhook
```bash
# Simuler un message texte
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -d 'From=whatsapp:+33612345678&Body=Bonjour'

# Simuler un message avec image
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -d 'From=whatsapp:+33612345678&Body=Voici mon reçu&NumMedia=1&MediaUrl0=https://example.com/receipt.jpg&MediaContentType0=image/jpeg'
```

### Mode simulation (GitHub Pages)
Sur GitHub Pages, WhatsApp est en mode **simulation** :
- Le bot répond avec des données fictives
- Pas de vrai envoi/réception
- Pour le vrai WhatsApp, il faut un serveur (Vercel Functions, Railway, etc.)

---

## 7. Webhooks personnalisés

### Configuration
1. Va sur l'onglet **Sheets & Webhooks**
2. Entre l'URL de ton endpoint (ERP, Zapier, n8n, Make)
3. (Optionnel) Entre un secret pour la signature HMAC

### Format du payload
```json
{
  "event": "receipt.parsed",
  "merchant": "Leroy Merlin Paris",
  "totalTTC": 185.00,
  "vatAmount": 30.83,
  "currency": "EUR",
  "timestamp": "2025-02-14T14:32:00.000Z"
}
```

### Signature HMAC-SHA256
Si un secret est configuré, le header `X-DocuSnap-Signature` est ajouté :
```
X-DocuSnap-Signature: t=1706198400,sha256=abc123...
```

Pour vérifier la signature côté récepteur :
```javascript
const crypto = require('crypto');
function verifySignature(payload, secret, signature) {
  const [t, sha256] = signature.split(',');
  const ts = t.split('=')[1];
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${ts}.${payload}`);
  return hmac.digest('hex') === sha256.split('=')[1];
}
```

---

## 8. Architecture technique

### Structure du projet
```
docusnap-ai/
├── src/                    # Frontend React
│   ├── api/                # Clients API (geminiClient.ts)
│   ├── components/         # Composants UI
│   ├── hooks/              # Hooks React (useAuth, usePlan, useApiKeys...)
│   ├── data/               # Données mock
│   ├── types.ts            # Types TypeScript
│   ├── config.ts           # Configuration (env vars)
│   └── App.tsx             # Composant principal
├── server/                 # Backend Node.js
│   ├── auth.ts             # Système d'authentification
│   ├── ocrParser.ts        # Moteur OCR local (Tesseract)
│   └── security.ts         # Rate limiting + headers sécurité
├── server.ts               # Serveur Express
├── .github/workflows/      # GitHub Actions
│   └── deploy.yml          # Déploiement GitHub Pages
├── data/                   # Données persistantes (mode serveur)
│   └── users.json          # Comptes utilisateurs
└── public/                 # Assets statiques
    └── favicon.svg         # Favicon DocuSnap
```

### Chaîne d'OCR (ordre de priorité)
1. **Preset SVG** → données directes (100% précision)
2. **Gemini Vision** → si clé configurée (~98% précision, ~3s)
3. **OpenRouter** → si clé configurée (~95%, ~15-40s)
4. **Tesseract local** → toujours disponible (~93%, ~3-5s)

### Flux d'authentification
```
Utilisateur → Register/Login → JWT signé → stocké en localStorage
    ↓
Requêtes API → header Authorization: Bearer <token>
    ↓
Serveur vérifie JWT → récupère l'utilisateur → autorise l'action
```

---

## 9. Freemium & Pricing

### Plan Free (0€/mois)
| Limite | Valeur |
|--------|--------|
| Scans OCR / mois | 10 |
| Moteur OCR | Tesseract local |
| Bot WhatsApp | ❌ |
| Webhooks | ❌ |
| Ledger reçus | 50 max |
| Export CSV | ✅ |

### Plan Pro (29€/mois)
| Limite | Valeur |
|--------|--------|
| Scans OCR / mois | ∞ |
| Moteur OCR | Gemini Vision AI |
| Bot WhatsApp | ✅ |
| Webhooks | ✅ |
| Ledger reçus | ∞ |
| Export CSV | ✅ |
| Support | Prioritaire |

### Gestion du plan
- Le plan est stocké en localStorage (côté client)
- En mode serveur, il est aussi dans `data/users.json`
- Le compteur de scans se réinitialise automatiquement chaque mois

---

## 10. FAQ & Dépannage

### L'app ne trouve pas la clé Gemini
→ Vérifie que `GEMINI_API_KEY` est dans `.env` (dev) ou dans les secrets GitHub (production).

### Le scan OCR est lent
→ Utilise Gemini au lieu de Tesseract. Configure une clé Gemini (gratuite).

### Les données disparaissent au refresh
→ Vérifie que localStorage n'est pas bloqué (mode navigation privée).

### Le webhook WhatsApp ne répond pas
→ Vérifie que le serveur est accessible publiquement. Utilise ngrok pour les tests locaux :
```bash
ngrok http 3000
# → copie l'URL https://xxxx.ngrok.io
# → configure Twilio webhook : https://xxxx.ngrok.io/api/whatsapp/webhook
```

### Erreur CORS quand l'app appelle Gemini
→ Vérifie que le domaine est autorisé dans Google AI Studio (HTTP referrer).

### Comment réinitialiser toutes les données ?
→ Settings → Zone de danger → "Tout réinitialiser"

### Le build GitHub Pages échoue
→ Vérifie que `npm run build` fonctionne en local. Vérifie les logs GitHub Actions.

---

## 📞 Support

- **Issues** : https://github.com/Brayan-Clark/docuSnap/issues
- **Email** : (à compléter)

---

*Dernière mise à jour : Août 2025*
