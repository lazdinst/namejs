import { Role } from "./unit";
import { WeaponType, SightType } from "./weapons";

/**
 * Military Occupational Specialty. Modelled on a Special Forces Operational
 * Detachment: every man is 18-series, and the letter is what he does.
 *
 * `role` is the in-simulation behaviour the MOS maps onto. Several MOS share a
 * role — a Bravo and a Charlie both fight as riflemen — and are told apart by
 * their attributes and what they carry.
 */
export enum Mos {
  /** Detachment commander. */
  A18 = "18A",
  /** Weapons sergeant. */
  B18 = "18B",
  /** Engineer sergeant. */
  C18 = "18C",
  /** Medical sergeant. */
  D18 = "18D",
  /** Communications sergeant. */
  E18 = "18E",
  /** Intelligence sergeant. */
  F18 = "18F",
  /** Operations sergeant, the team sergeant. */
  Z18 = "18Z",
}

/**
 * A soldier's attributes, each 1–10. These are the "player stats" a squad is
 * built around, and each one feeds a specific piece of the simulation.
 */
export interface Attributes {
  /** Hit probability multiplier. */
  marksmanship: number;
  /** Resistance to suppression and morale loss. */
  composure: number;
  /** Movement speed and load capacity. */
  fitness: number;
  /** Detection range, and how far contact reports carry. */
  awareness: number;
  /** Speed and quality of casualty treatment. */
  medicine: number;
  /** Rally radius and strength for the men around them. */
  leadership: number;
}

export interface MosDefinition {
  mos: Mos;
  title: string;
  /** What this MOS does in the fight. */
  summary: string;
  role: Role;
  /** Default weapon issue. A player can swap within `allowedPrimaries`. */
  primaryWeapon: WeaponType;
  secondaryWeapon: WeaponType;
  primaryWeaponSight: SightType;
  allowedPrimaries: WeaponType[];
  /** Attribute floor a soldier of this MOS is generated from. */
  baseline: Attributes;
  /** Kilograms this MOS can carry into the fight. */
  loadCapacityKg: number;
}

export const mosDefinitions: Record<Mos, MosDefinition> = {
  [Mos.A18]: {
    mos: Mos.A18,
    title: "Detachment Commander",
    summary: "Holds the element together. Every man near him fights steadier.",
    role: Role.SquadLeader,
    primaryWeapon: WeaponType.AssaultRifle,
    secondaryWeapon: WeaponType.Pistol,
    primaryWeaponSight: SightType.RedDot,
    allowedPrimaries: [WeaponType.AssaultRifle, WeaponType.SMG],
    baseline: {
      marksmanship: 6,
      composure: 8,
      fitness: 6,
      awareness: 7,
      medicine: 3,
      leadership: 9,
    },
    loadCapacityKg: 28,
  },
  [Mos.Z18]: {
    mos: Mos.Z18,
    title: "Operations Sergeant",
    summary: "The team sergeant. Second rally point when the commander is down.",
    role: Role.SquadLeader,
    primaryWeapon: WeaponType.AssaultRifle,
    secondaryWeapon: WeaponType.Pistol,
    primaryWeaponSight: SightType.RedDot,
    allowedPrimaries: [WeaponType.AssaultRifle, WeaponType.SMG],
    baseline: {
      marksmanship: 7,
      composure: 9,
      fitness: 6,
      awareness: 7,
      medicine: 4,
      leadership: 8,
    },
    loadCapacityKg: 28,
  },
  [Mos.B18]: {
    mos: Mos.B18,
    title: "Weapons Sergeant",
    summary: "Carries the gun. Volume of fire is his job — he pins, others move.",
    role: Role.LightMachineGunner,
    primaryWeapon: WeaponType.LightMachineGun,
    secondaryWeapon: WeaponType.Pistol,
    primaryWeaponSight: SightType.IronSights,
    allowedPrimaries: [
      WeaponType.LightMachineGun,
      WeaponType.AssaultRifle,
      WeaponType.SniperRifle,
    ],
    baseline: {
      marksmanship: 8,
      composure: 7,
      fitness: 8,
      awareness: 5,
      medicine: 2,
      leadership: 5,
    },
    loadCapacityKg: 36,
  },
  [Mos.C18]: {
    mos: Mos.C18,
    title: "Engineer Sergeant",
    summary: "Demolitions and obstacles. Carries the grenades and the breaching kit.",
    role: Role.Grenadier,
    primaryWeapon: WeaponType.AssaultRifle,
    secondaryWeapon: WeaponType.GrenadeLauncher,
    primaryWeaponSight: SightType.IronSights,
    allowedPrimaries: [WeaponType.AssaultRifle, WeaponType.SMG],
    baseline: {
      marksmanship: 6,
      composure: 6,
      fitness: 7,
      awareness: 6,
      medicine: 3,
      leadership: 4,
    },
    loadCapacityKg: 32,
  },
  [Mos.D18]: {
    mos: Mos.D18,
    title: "Medical Sergeant",
    summary: "Keeps casualties alive. The difference between wounded and dead.",
    role: Role.Medic,
    primaryWeapon: WeaponType.SMG,
    secondaryWeapon: WeaponType.Pistol,
    primaryWeaponSight: SightType.RedDot,
    allowedPrimaries: [WeaponType.SMG, WeaponType.AssaultRifle],
    baseline: {
      marksmanship: 5,
      composure: 8,
      fitness: 7,
      awareness: 6,
      medicine: 10,
      leadership: 5,
    },
    loadCapacityKg: 30,
  },
  [Mos.E18]: {
    mos: Mos.E18,
    title: "Communications Sergeant",
    summary: "Contact reports go round faster with him alive. Fights as a rifleman.",
    role: Role.Rifleman,
    primaryWeapon: WeaponType.AssaultRifle,
    secondaryWeapon: WeaponType.Pistol,
    primaryWeaponSight: SightType.IronSights,
    allowedPrimaries: [WeaponType.AssaultRifle, WeaponType.SMG],
    baseline: {
      marksmanship: 6,
      composure: 6,
      fitness: 6,
      awareness: 9,
      medicine: 3,
      leadership: 4,
    },
    loadCapacityKg: 30,
  },
  [Mos.F18]: {
    mos: Mos.F18,
    title: "Intelligence Sergeant",
    summary: "Sees first and shoots far. The element's recon and marksman.",
    role: Role.Recon,
    primaryWeapon: WeaponType.SniperRifle,
    secondaryWeapon: WeaponType.SMG,
    primaryWeaponSight: SightType.Scope,
    allowedPrimaries: [WeaponType.SniperRifle, WeaponType.AssaultRifle],
    baseline: {
      marksmanship: 9,
      composure: 7,
      fitness: 7,
      awareness: 9,
      medicine: 2,
      leadership: 4,
    },
    loadCapacityKg: 26,
  },
};

export const allMos = Object.values(Mos);

// ---------------------------------------------------------------- effects

/** How each attribute feeds the simulation. Centred on 5; 10 is elite. */
const scale = (value: number, spread: number) => 1 + ((value - 5) / 5) * spread;

/** Hit-chance multiplier: a 10 shoots 30% better than average, a 1 shoots 24% worse. */
export const marksmanshipMultiplier = (a: Attributes) => scale(a.marksmanship, 0.3);

/** Multiplier on suppression and morale loss taken. Lower is steadier. */
export const composureResistance = (a: Attributes) => 1 / scale(a.composure, 0.4);

export const fitnessSpeedMultiplier = (a: Attributes) => scale(a.fitness, 0.25);

export const awarenessRangeMultiplier = (a: Attributes) => scale(a.awareness, 0.35);

/** Treatment speed multiplier — a 10 works twice as fast as a 5. */
export const medicineSpeedMultiplier = (a: Attributes) => scale(a.medicine, 1.0);

/** Rally radius multiplier for leaders. */
export const leadershipRadiusMultiplier = (a: Attributes) => scale(a.leadership, 0.5);

// ------------------------------------------------------------- generation

const ATTRIBUTE_KEYS: (keyof Attributes)[] = [
  "marksmanship",
  "composure",
  "fitness",
  "awareness",
  "medicine",
  "leadership",
];

const clampAttr = (v: number) => Math.max(1, Math.min(10, Math.round(v)));

/**
 * A soldier's attributes: the MOS baseline with individual variation, so two
 * 18Bs are recognisably weapons sergeants and still not the same man.
 */
export function rollAttributes(
  mos: Mos,
  random: () => number,
  variance = 1.5
): Attributes {
  const base = mosDefinitions[mos].baseline;
  const rolled = {} as Attributes;

  for (const key of ATTRIBUTE_KEYS) {
    const jitter = (random() * 2 - 1) * variance;
    rolled[key] = clampAttr(base[key] + jitter);
  }

  return rolled;
}

/** Overall rating, 1–10 — a single number for the draft board. */
export function overallRating(a: Attributes): number {
  const sum = ATTRIBUTE_KEYS.reduce((acc, key) => acc + a[key], 0);
  return Math.round((sum / ATTRIBUTE_KEYS.length) * 10) / 10;
}

// ------------------------------------------------------------- the roster

/** A named, generated soldier available to be picked. */
export interface SoldierCard {
  id: string;
  callsign: string;
  mos: Mos;
  attributes: Attributes;
  rating: number;
}

const CALLSIGNS = [
  "Anvil", "Badger", "Cutter", "Dagger", "Ember", "Falcon", "Gator", "Hatchet",
  "Iron", "Jackal", "Kodiak", "Lancer", "Mako", "Nomad", "Onyx", "Piston",
  "Quill", "Raptor", "Saber", "Talon", "Umber", "Viper", "Wraith", "Yukon",
  "Zephyr", "Basalt", "Cinder", "Drake", "Flint", "Granite", "Hollow", "Juniper",
];

/**
 * Generate a draft pool: several candidates for every MOS, so a player
 * has real choices rather than one man per slot.
 */
export function generateRoster(
  random: () => number,
  perMos = 3
): SoldierCard[] {
  const roster: SoldierCard[] = [];
  let n = 0;

  for (const mos of allMos) {
    for (let i = 0; i < perMos; i += 1) {
      const attributes = rollAttributes(mos, random);
      const callsign = CALLSIGNS[Math.floor(random() * CALLSIGNS.length)];

      roster.push({
        id: `${mos}-${n}`,
        callsign: `${callsign}-${n}`,
        mos,
        attributes,
        rating: overallRating(attributes),
      });
      n += 1;
    }
  }

  return roster;
}
