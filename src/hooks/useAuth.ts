import { useState, useEffect, useCallback } from 'react';

interface AuthUser {
  id: string;
  email: string;
  plan: 'free' | 'pro';
  createdAt?: string;
}

const TOKEN_KEY = 'docusnap.token.v1';
const USER_KEY = 'docusnap.user.v1';

/**
 * Gestion de l'authentification (JWT + localStorage).
 * L'utilisateur peut utiliser l'app sans compte (mode démo),
 * mais un compte est requis pour le plan Pro.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persister token + user
  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  // Vérifier le token au montage
  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
        else { setToken(null); setUser(null); }
      })
      .catch(() => { setToken(null); setUser(null); });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inscription');
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally { setLoading(false); }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur connexion');
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  /** Met à jour le plan côté serveur + local. */
  const updatePlan = useCallback(async (plan: 'free' | 'pro') => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch { /* silencieux */ }
  }, [token]);

  return { user, token, loading, error, isLoggedIn: !!token && !!user, register, login, logout, updatePlan, setError };
}
