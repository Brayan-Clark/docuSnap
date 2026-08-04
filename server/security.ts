/**
 * DocuSnap AI — Middlewares de sécurité.
 *
 * Rate limiting en mémoire (sliding window) + security headers.
 * Aucune dépendance externe.
 */

import { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// Rate Limiter (sliding window, en mémoire)
// ---------------------------------------------------------------------------

interface RateEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateEntry>();

/**
 * Crée un rate limiter avec config custom.
 * @param windowMs  fenêtre glissante en ms
 * @param max        nombre max de requêtes par fenêtre
 */
export function rateLimiter(windowMs = 60_000, max = 30) {
  // Nettoyage périodique des entrées expirées (toutes les 5 min)
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets) {
      if (now > entry.resetAt) buckets.delete(key);
    }
  }, 300_000).unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = buckets.get(key);

    if (!entry || now > entry.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        error: "Trop de requêtes. Réessayez dans " + retryAfter + " secondes.",
      });
    }

    next();
  };
}

// ---------------------------------------------------------------------------
// Security Headers
// ---------------------------------------------------------------------------

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Empêche le clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Active le sniffing MIME
  res.setHeader("X-Content-Type-Options", "nosniff");
  // XSS filter
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy (camera, microphone disabled)
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // HSTS (uniquement en production derrière HTTPS)
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

// ---------------------------------------------------------------------------
// Input Sanitization Middleware
// ---------------------------------------------------------------------------

/** Limite la taille du body JSON (déjà fait via express.json({limit}), maisdouble check */
export function maxBodySize(maxBytes = 5_000_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    if (contentLength > maxBytes) {
      return res.status(413).json({ error: "Requête trop volumineuse." });
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// API Key Middleware (pour les routes webhook — optionnel)
// ---------------------------------------------------------------------------

/**
 * Vérifie la présence d'un header X-API-Key valide.
 * Utilisé pour protéger les endpoints webhook en production.
 */
export function apiKeyGuard(validKeys: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers["x-api-key"] as string;
    if (!apiKey || !validKeys.includes(apiKey)) {
      return res.status(403).json({ error: "API key invalide ou manquante." });
    }
    next();
  };
}
