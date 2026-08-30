import { WeaponType } from "./weapons";
import { BleedSeverity } from "./vitals";

/** One round that connected, and who put it there. */
export interface DamageRecord {
  attackerId: string;
  weapon: WeaponType;
  /** Damage that got through cover. */
  damage: number;
  /** Damage the target's cover stopped. */
  absorbed: number;
  meters: number;
  tick: number;
  bleed: BleedSeverity;
  /** True for the round that finished them. */
  fatal: boolean;
}

/** Rounds retained per unit. Enough for an after-action read, not unbounded. */
export const DAMAGE_LOG_LIMIT = 40;

/** Share of a casualty's damage that counts as an assist rather than noise. */
export const ASSIST_THRESHOLD = 0.15;

/** Total damage each attacker did to a casualty, worst first. */
export function damageByAttacker(
  log: DamageRecord[]
): { attackerId: string; damage: number; rounds: number }[] {
  const totals = new Map<string, { damage: number; rounds: number }>();

  for (const record of log) {
    const entry = totals.get(record.attackerId) ?? { damage: 0, rounds: 0 };
    entry.damage += record.damage;
    entry.rounds += 1;
    totals.set(record.attackerId, entry);
  }

  return [...totals.entries()]
    .map(([attackerId, entry]) => ({ attackerId, ...entry }))
    .sort((a, b) => b.damage - a.damage);
}

/**
 * Everyone who contributed meaningfully to a casualty without landing the
 * final round. A kill belongs to whoever finished it; an assist belongs to
 * whoever did the work.
 */
export function assistsFor(
  log: DamageRecord[],
  killerId: string | null
): string[] {
  const total = log.reduce((sum, record) => sum + record.damage, 0);
  if (total <= 0) return [];

  return damageByAttacker(log)
    .filter(
      (entry) =>
        entry.attackerId !== killerId &&
        entry.damage / total >= ASSIST_THRESHOLD
    )
    .map((entry) => entry.attackerId);
}
