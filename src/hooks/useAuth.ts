import { useState, useEffect, useCallback } from 'react';

interface AuthUser {
  id: string;
  email: string;
  plan: 'free' | 'pro';
  createdAt?: string;
}

const USERS_KEY = 'docusnap.users.v1'; // liste d'utilisateurs en localStorage
const USER_KEY = 'docusnap.user.v1';   // utilisateur courant

/**
 * Auth 100% client-side (localStorage) + serveur optionnel.
 * Fonctionne sur GitHub Pages SANS backend.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persister l'utilisateur
  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  // ── Helpers localStorage ──────────────────────────────────────────────────
  const getUsers = (): Record<string, { email: string; password: string; plan: string; id: string; createdAt?: string }> => {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
  };

  const saveUsers = (users: Record<string, any>) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const simpleHash = (s: string): string => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36);
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      // Essayer le serveur d'abord
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          signal: AbortSignal.timeout(3000),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          setLoading(false);
          return true;
        }
      } catch { /* serveur indisponible → mode local */ }

      // Mode local (GitHub Pages ou serveur indisponible)
      const users = getUsers();
      const key = email.toLowerCase().trim();

      if (users[key]) {
        throw new Error('Un compte existe déjà avec cet email.');
      }

      const newUser: AuthUser = {
        id: 'usr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        email: key,
        plan: 'free',
        createdAt: new Date().toISOString(),
      };

      users[key] = { ...newUser, password: simpleHash(password) };
      saveUsers(users);
      setUser(newUser);
      return true;
    } catch (err: any) {
      setError(err.message || 'Erreur inscription');
      return false;
    } finally { setLoading(false); }
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      // Essayer le serveur d'abord
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          signal: AbortSignal.timeout(3000),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          setLoading(false);
          return true;
        }
      } catch { /* serveur indisponible → mode local */ }

      // Mode local
      const users = getUsers();
      const key = email.toLowerCase().trim();
      const stored = users[key];

      if (!stored || stored.password !== simpleHash(password)) {
        throw new Error('Email ou mot de passe incorrect.');
      }

      setUser({ id: stored.id, email: stored.email, plan: stored.plan as 'free' | 'pro', createdAt: stored.createdAt });
      return true;
    } catch (err: any) {
      setError(err.message || 'Erreur connexion');
      return false;
    } finally { setLoading(false); }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  }, []);

  // ── Update plan ───────────────────────────────────────────────────────────
  const updatePlan = useCallback(async (plan: 'free' | 'pro') => {
    if (!user) return;
    // Mettre à jour en local
    const updated = { ...user, plan };
    setUser(updated);

    // Essayer le serveur
    try {
      await fetch('/api/auth/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
        signal: AbortSignal.timeout(3000),
      });
    } catch { /* silencieux */ }

    // Mettre à jour dans la liste des users
    const users = getUsers();
    if (users[user.email]) {
      users[user.email].plan = plan;
      saveUsers(users);
    }
  }, [user]);

  return { user, loading, error, isLoggedIn: !!user, register, login, logout, updatePlan, setError };
}
