import { useLocalStorage } from './useLocalStorage';
import { PlanType, PLANS } from '../types';

/**
 * Gestion du plan utilisateur + compteur d'utilisation mensuel.
 * Toute la logique freemium passe par ce hook.
 */
export function usePlan() {
  const [planType, setPlanType] = useLocalStorage<PlanType>('docusnap.plan.v1', 'free');
  const [usage, setUsage] = useLocalStorage<{ month: string; scans: number }>(
    'docusnap.usage.v1',
    { month: currentMonth(), scans: 0 }
  );

  // Réinitialise le compteur si on a changé de mois
  const currentMonthKey = currentMonth();
  if (usage.month !== currentMonthKey) {
    setUsage({ month: currentMonthKey, scans: 0 });
  }

  const config = PLANS[planType];
  const isPro = planType === 'pro';
  const scansUsed = usage.scans;
  const scansRemaining = config.scansPerMonth === -1 ? Infinity : Math.max(0, config.scansPerMonth - scansUsed);
  const canScan = config.scansPerMonth === -1 || scansUsed < config.scansPerMonth;

  /** Incrémente le compteur de scans. */
  const incrementUsage = () => {
    setUsage((prev) => {
      if (prev.month !== currentMonthKey) return { month: currentMonthKey, scans: 1 };
      return { ...prev, scans: prev.scans + 1 };
    });
  };

  /** Passe au plan Pro (appelé après paiement simulé réussi). */
  const upgradeToPro = () => setPlanType('pro');

  /** Redescend au plan Free. */
  const downgradeToFree = () => setPlanType('free');

  return {
    planType,
    config,
    isPro,
    scansUsed,
    scansRemaining,
    canScan,
    incrementUsage,
    upgradeToPro,
    downgradeToFree,
    setPlanType,
  };
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
