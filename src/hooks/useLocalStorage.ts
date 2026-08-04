import { useEffect, useState } from 'react';

/**
 * État React synchronisé avec localStorage.
 * Les données survivent au refresh — l'app reste opérationnelle sans backend.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        // Ne restitue que si le type correspond à la valeur initiale
        // (protection contre un stockage corrompu / d'une ancienne version)
        if (Array.isArray(initialValue)) {
          if (Array.isArray(parsed)) return parsed as T;
        } else if (parsed && typeof parsed === 'object') {
          return parsed as T;
        }
      }
    } catch {
      // stockage indisponible (mode privé, etc.) → on garde la valeur initiale
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota dépassé ou stockage bloqué → silencieux
    }
  }, [key, value]);

  return [value, setValue] as const;
}
