import { InventoryType } from "./inventory";
import { WeaponType, SightType } from "./weapons";
import { Coordinate } from "./location";
import { CoverType } from "./terrain";
import { BleedSeverity, Vitals } from "./vitals";
import { DamageRecord } from "./damage";
import type { Mos, Attributes } from "./mos";

export enum Role {
  SquadLeader = "squadLeader",
  Rifleman = "rifleman",
  LightMachineGunner = "lightMachineGunner",
  Grenadier = "grenadier",
  Recon = "recon",
  Medic = "medic",
}

export interface UnitType {
  id: string;
  /** Who this man is. Null for a unit seeded from a bare role. */
  callsign: string | null;
  mos: Mos | null;
  attributes: Attributes;
  position: Coordinate;
  destination: Coordinate | null;
  speedMetersPerSecond: number;
  /** Which weapon is up; falls back to the sidearm when the primary is dry. */
  activeWeapon: "primary" | "secondary";
  /** Rounds loaded in the active weapon. */
  magazine: number;
  /** Simulated seconds left in a reload, or 0 when not reloading. */
  reloadRemaining: number;
  health: number;
  healthStatus: HealthStatus;
  status: UnitStatusType;
  /** Circulating blood volume, 1 is whole. Bleeding drains it. */
  bloodVolume: number;
  /** Open bleeds, each draining volume until dressed. */
  bleeds: BleedSeverity[];
  /** Derived cardiovascular state — what a medic reads off the casualty. */
  vitals: Vitals;
  /** True once volume loss has put the casualty on the ground. */
  incapacitated: boolean;
  /** Every round that connected, and who fired it. */
  damageTaken: DamageRecord[];
  /** Whoever landed the finishing round. */
  killedBy: string | null;
  /** Units this one finished off. */
  kills: string[];
  /** Casualties this unit did real work on without finishing. */
  assists: string[];
  /** How hard this unit is being shot at, 0–1. Decays when fire lifts. */
  suppression: number;
  /** Willingness to keep fighting, 0–1. */
  morale: number;
  moraleState: MoraleState;
  cover: CoverType;
  role: Role;
  inventory: InventoryType;
  bodyParts: BodyPart[];
  primaryWeapon: WeaponType;
  secondaryWeapon: WeaponType;
  primaryWeaponSight: SightType;
  secondaryWeaponSight: SightType;
}

export enum UnitStatusType {
  Idle = "idle",
  Engaged = "engaged",
  Moving = "moving",
  /** Held down by incoming fire — cannot advance, shoots badly. */
  Pinned = "pinned",
  /** Morale has gone; falling back to the rally point. */
  Withdrawing = "withdrawing",
  /** Down from blood loss — alive, out of the fight, dying on a clock. */
  Down = "down",
  /** A medic working on a casualty. */
  Treating = "treating",
  Kia = "kia",
}

/**
 * Steady units follow their orders. Shaken units stop advancing and look for
 * cover. Broken units quit the fight and fall back.
 */
export type MoraleState = "steady" | "shaken" | "broken";

export type HealthStatus = "healthy" | "wounded" | "critical" | "kia";

export interface BodyPart {
  name:
    | "head"
    | "thorax"
    | "stomach"
    | "leftArm"
    | "rightArm"
    | "leftLeg"
    | "rightLeg";
  hitPoints: number;
}

// Default body parts for each unit
export const defaultBodyParts: BodyPart[] = [
  { name: "head", hitPoints: 35 },
  { name: "thorax", hitPoints: 85 },
  { name: "stomach", hitPoints: 50 },
  { name: "leftArm", hitPoints: 50 },
  { name: "rightArm", hitPoints: 50 },
  { name: "leftLeg", hitPoints: 50 },
  { name: "rightLeg", hitPoints: 50 },
];

// Movement speed in metres per second, on foot and carrying the role's kit.
// A machine gunner humping 300 rounds is slower than a recon element.
export const defaultSpeeds: Record<Role, number> = {
  [Role.SquadLeader]: 1.6,
  [Role.Rifleman]: 1.5,
  [Role.LightMachineGunner]: 1.1,
  [Role.Grenadier]: 1.3,
  [Role.Recon]: 2.0,
  [Role.Medic]: 1.6,
};

// ---------------------------------------------------------------- suppression

/** Suppression added to a unit that is hit. */
export const SUPPRESSION_PER_HIT = 0.3;
/** Suppression added to a unit that is missed — the round still went past. */
export const SUPPRESSION_PER_NEAR_MISS = 0.16;
/** Rounds also unsettle friends this close to the target. */
export const SUPPRESSION_SPLASH_METERS = 14;
/** Fraction of the suppression a splashed neighbour receives. */
export const SUPPRESSION_SPLASH_FACTOR = 0.45;
/** Suppression bled off per simulated second once fire lifts. */
export const SUPPRESSION_DECAY_PER_SECOND = 0.085;
/** At or above this, a unit is pinned and cannot advance. */
export const PINNED_THRESHOLD = 0.6;

/** Accuracy multiplier for a shooter under fire. Fully suppressed shoots at 25%. */
export function suppressionAccuracy(suppression: number): number {
  return 1 - 0.75 * clamp01(suppression);
}

/** Movement multiplier for a unit under fire. */
export function suppressionSpeed(suppression: number): number {
  return 1 - 0.65 * clamp01(suppression);
}

// -------------------------------------------------------------------- morale

/** Morale lost by the unit that takes a wound, per point of damage. */
export const MORALE_PER_DAMAGE = 0.0011;
/** Morale lost by friends who watch someone die nearby. */
export const MORALE_FRIENDLY_KIA = 0.16;
/** How far the shock of a casualty carries. */
export const MORALE_KIA_RADIUS_METERS = 70;
/** Extra platoon-wide morale lost when the squad leader goes down. */
export const MORALE_LEADER_KIA = 0.22;
/** Morale drained per simulated second, scaled by current suppression. */
export const MORALE_DRAIN_PER_SECOND = 0.055;
/** Men running for their lives move faster than men advancing under fire. */
export const BROKEN_FLIGHT_SPEED = 1.35;

/** Morale recovered per simulated second while out of contact. */
export const MORALE_RECOVERY_PER_SECOND = 0.03;
/** Recovery multiplier for units near a living squad leader. */
export const MORALE_LEADER_RALLY_BONUS = 1.8;
/** How close a leader has to be to steady the men around them. */
export const MORALE_LEADER_RADIUS_METERS = 90;

const SHAKEN_BELOW = 0.6;
const BROKEN_BELOW = 0.28;
/** Hysteresis — recover past these before improving, so states do not flutter. */
const RALLY_TO_SHAKEN_ABOVE = 0.42;
const RALLY_TO_STEADY_ABOVE = 0.72;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Next morale state, given where the unit already is. Deliberately asymmetric:
 * a unit breaks quickly and recovers slowly, and the thresholds it has to climb
 * back through are higher than the ones it fell past.
 */
export function moraleStateFor(
  current: MoraleState,
  morale: number
): MoraleState {
  const value = clamp01(morale);

  if (value < BROKEN_BELOW) return "broken";

  if (current === "broken") {
    return value > RALLY_TO_SHAKEN_ABOVE ? "shaken" : "broken";
  }

  if (value < SHAKEN_BELOW) return "shaken";

  if (current === "shaken") {
    return value > RALLY_TO_STEADY_ABOVE ? "steady" : "shaken";
  }

  return "steady";
}
