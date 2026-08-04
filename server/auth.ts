/**
 * DocuSnap AI — Système d'authentification léger.
 *
 * - Inscription / connexion par email + mot de passe
 * - Hash bcrypt-like via crypto.scrypt (natif Node, aucune dépendance externe)
 * - Sessions JWT signées
 * - Stockage dans data/users.json (MVP — migrate vers SQLite/Postgres en prod)
 */

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import jwt from "jsonwebtoken";
import { Express, Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DATA_DIR = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "users.json");
const JWT_SECRET = process.env.JWT_SECRET || "docusnap-dev-secret-change-in-prod";
const JWT_EXPIRES = "30d";

export interface User {
  id: string;
  email: string;
  passwordHash: string;   // salt:hash
  plan: "free" | "pro";
  planActivatedAt?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Storage (JSON file)
// ---------------------------------------------------------------------------

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadUsers(): User[] {
  ensureDataDir();
  if (!existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  ensureDataDir();
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt, timing-safe)
// ---------------------------------------------------------------------------

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const hashToCheck = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(hashToCheck, "hex"));
}

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export function setupAuthRoutes(app: Express) {

  // ── Inscription ──────────────────────────────────────────────────────────
  app.post("/api/auth/register", (req: Request, res: Response) => {
    try {
      const { email, password } = req.body || {};

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: "Email et mot de passe requis." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Adresse email invalide." });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Le mot de passe doit faire au moins 6 caractères." });
      }

      const users = loadUsers();

      // Vérifier unicité
      if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
      }

      // Créer l'utilisateur
      const user: User = {
        id: "usr-" + Date.now() + "-" + randomBytes(4).toString("hex"),
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
        plan: "free",
        createdAt: new Date().toISOString(),
      };

      users.push(user);
      saveUsers(users);

      const token = signToken(user.id);
      res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email, plan: user.plan },
      });
    } catch (err: any) {
      console.error("[auth] register error:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  // ── Connexion ────────────────────────────────────────────────────────────
  app.post("/api/auth/login", (req: Request, res: Response) => {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: "Email et mot de passe requis." });
      }

      const users = loadUsers();
      const user = users.find((u) => u.email === email.toLowerCase().trim());

      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: "Email ou mot de passe incorrect." });
      }

      const token = signToken(user.id);
      res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email, plan: user.plan },
      });
    } catch (err: any) {
      console.error("[auth] login error:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  // ── Profil (authentifié) ─────────────────────────────────────────────────
  app.get("/api/auth/me", authMiddleware, (req: Request, res: Response) => {
    const user = (req as any).user as User;
    res.json({
      success: true,
      user: { id: user.id, email: user.email, plan: user.plan, createdAt: user.createdAt },
    });
  });

  // ── Changement de plan ───────────────────────────────────────────────────
  app.put("/api/auth/plan", authMiddleware, (req: Request, res: Response) => {
    try {
      const user = (req as any).user as User;
      const { plan } = req.body || {};

      if (!["free", "pro"].includes(plan)) {
        return res.status(400).json({ error: "Plan invalide. 'free' ou 'pro' requis." });
      }

      const users = loadUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx === -1) return res.status(404).json({ error: "Utilisateur introuvable." });

      users[idx].plan = plan;
      if (plan === "pro") users[idx].planActivatedAt = new Date().toISOString();
      saveUsers(users);

      res.json({
        success: true,
        user: { id: users[idx].id, email: users[idx].email, plan: users[idx].plan },
      });
    } catch (err: any) {
      console.error("[auth] plan update error:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });
}

// ---------------------------------------------------------------------------
// Auth Middleware
// ---------------------------------------------------------------------------

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token d'authentification requis." });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Token expiré ou invalide." });
  }

  const users = loadUsers();
  const user = users.find((u) => u.id === payload.sub);
  if (!user) {
    return res.status(401).json({ error: "Utilisateur introuvable." });
  }

  (req as any).user = user;
  next();
}
