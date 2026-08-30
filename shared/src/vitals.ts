/**
 * Casualty physiology.
 *
 * A unit's condition is not just a number going down: it bleeds, and what
 * bleeding does is drop circulating volume. Heart rate climbs to compensate
 * and blood pressure falls, and the ratio between the two — the shock index —
 * is the number a medic actually reads off a casualty.
 */

/** Bleed severity opened by a wound. */
export type BleedSeverity = "none" | "light" | "heavy";

export interface Vitals {
  /** Circulating volume, 1 is whole. */
  bloodVolume: number;
  /** Beats per minute. */
  heartRate: number;
  /** Systolic pressure, mmHg. */
  systolic: number;
  /** Heart rate over systolic pressure. */
  shockIndex: number;
  state: ShockState;
}

/**
 * Clinical bands. A healthy adult sits near 0.6; 0.9 is the usual threshold
 * for occult shock, and past about 1.4 a casualty is in serious trouble.
 */
export type ShockState = "stable" | "compensating" | "shock" | "critical";

export const SHOCK_COMPENSATING = 0.9;
export const SHOCK_SEVERE = 1.4;
export const SHOCK_CRITICAL = 2.0;

/** Volume below which a casualty goes down and can no longer fight. */
export const BLOOD_INCAPACITATED = 0.45;
/** Volume below which they are gone. */
export const BLOOD_FATAL = 0.25;

/** A light wound clots on its own after this long. Heavy ones never do. */
export const LIGHT_BLEED_CLOTS_AFTER_SECONDS = 120;

/** Fraction of volume lost per simulated second, per open bleed. */
export const BLEED_RATE: Record<BleedSeverity, number> = {
  none: 0,
  light: 0.0016,
  heavy: 0.0052,
};

/** Damage in a single round above which the wound bleeds heavily. */
export const HEAVY_BLEED_DAMAGE = 45;
/** Damage below which a round leaves no open bleed at all. */
export const MINOR_WOUND_DAMAGE = 12;

/** Volume lost immediately by a wound, per point of damage. */
export const BLOOD_LOSS_PER_DAMAGE = 0.0009;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** How badly a wound of this size bleeds. */
export function bleedFromDamage(damage: number): BleedSeverity {
  if (damage >= HEAVY_BLEED_DAMAGE) return "heavy";
  if (damage >= MINOR_WOUND_DAMAGE) return "light";
  return "none";
}

/**
 * Vitals from circulating volume.
 *
 * Both curves are the textbook compensatory response, linearised: the heart
 * speeds up and the pressure drops as volume is lost, which is why the ratio
 * between them climbs so much faster than either number alone.
 */
export function vitalsFor(bloodVolume: number): Vitals {
  const volume = clamp01(bloodVolume);
  const lost = 1 - volume;

  const heartRate = 70 + lost * 115;
  const systolic = Math.max(35, 120 - lost * 72);
  const shockIndex = heartRate / systolic;

  return {
    bloodVolume: volume,
    heartRate,
    systolic,
    shockIndex,
    state: shockStateFor(shockIndex),
  };
}

export function shockStateFor(shockIndex: number): ShockState {
  if (shockIndex >= SHOCK_CRITICAL) return "critical";
  if (shockIndex >= SHOCK_SEVERE) return "shock";
  if (shockIndex >= SHOCK_COMPENSATING) return "compensating";
  return "stable";
}

/**
 * Accuracy multiplier for a casualty still in the fight. Shock costs a unit
 * its hands long before it costs it its life.
 */
export function shockAccuracy(shockIndex: number): number {
  if (shockIndex <= SHOCK_COMPENSATING) return 1;
  const over = Math.min(1, (shockIndex - SHOCK_COMPENSATING) / 1.1);
  return 1 - 0.6 * over;
}

/** Movement multiplier for a casualty. */
export function shockSpeed(shockIndex: number): number {
  if (shockIndex <= SHOCK_COMPENSATING) return 1;
  const over = Math.min(1, (shockIndex - SHOCK_COMPENSATING) / 1.1);
  return 1 - 0.55 * over;
}

// ------------------------------------------------------------------ treatment

/** Simulated seconds to dress a bleed. */
export const TREAT_SECONDS: Record<Exclude<BleedSeverity, "none">, number> = {
  light: 14,
  heavy: 26,
};

/** Volume a medic can restore while treating, per simulated second. */
export const TRANSFUSION_PER_SECOND = 0.006;

/** How close a medic has to be to work on a casualty. */
export const TREAT_RANGE_METERS = 3;

/**
 * A casualty holds position once a medic is this close and coming for them.
 * Without it the walking wounded stroll away faster than the medic closes,
 * and the two simply chase each other across the map.
 */
export const AWAIT_TREATMENT_RADIUS_METERS = 80;

/**
 * A casualty on the ground bleeds more slowly than one still running around:
 * they are prone, still, and the body is compensating. This is the window a
 * medic has to reach them in.
 */
export const DOWNED_BLEED_MULTIPLIER = 0.1;
