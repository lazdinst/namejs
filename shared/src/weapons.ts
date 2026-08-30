import { Role } from "./unit";

export enum WeaponType {
  AssaultRifle = "assaultRifle",
  LightMachineGun = "lightMachineGun",
  GrenadeLauncher = "grenadeLauncher",
  SniperRifle = "sniperRifle",
  Pistol = "pistol",
  SMG = "smg",
}

export enum SightType {
  Scope = "scope",
  RedDot = "redDot",
  IronSights = "ironSights",
}

// Default weapons and sights for each role
export const defaultWeapons: Record<
  Role,
  {
    primaryWeapon: WeaponType;
    secondaryWeapon: WeaponType;
    primaryWeaponSight: SightType;
    secondaryWeaponSight: SightType;
  }
> = {
  [Role.SquadLeader]: {
    primaryWeapon: WeaponType.AssaultRifle,
    secondaryWeapon: WeaponType.Pistol,
    primaryWeaponSight: SightType.RedDot,
    secondaryWeaponSight: SightType.IronSights,
  },
  [Role.Rifleman]: {
    primaryWeapon: WeaponType.AssaultRifle,
    secondaryWeapon: WeaponType.Pistol,
    primaryWeaponSight: SightType.IronSights,
    secondaryWeaponSight: SightType.IronSights,
  },
  [Role.LightMachineGunner]: {
    primaryWeapon: WeaponType.LightMachineGun,
    secondaryWeapon: WeaponType.Pistol,
    primaryWeaponSight: SightType.IronSights,
    secondaryWeaponSight: SightType.IronSights,
  },
  [Role.Grenadier]: {
    primaryWeapon: WeaponType.AssaultRifle,
    secondaryWeapon: WeaponType.GrenadeLauncher,
    primaryWeaponSight: SightType.IronSights,
    secondaryWeaponSight: SightType.IronSights,
  },
  [Role.Recon]: {
    primaryWeapon: WeaponType.SniperRifle,
    secondaryWeapon: WeaponType.SMG,
    primaryWeaponSight: SightType.Scope,
    secondaryWeaponSight: SightType.IronSights,
  },
  // Lightly armed by design — a medic is carrying an aid bag, not a fight.
  [Role.Medic]: {
    primaryWeapon: WeaponType.SMG,
    secondaryWeapon: WeaponType.Pistol,
    primaryWeaponSight: SightType.RedDot,
    secondaryWeaponSight: SightType.IronSights,
  },
};

// Effective range for each weapon type and sight combination
export const weaponEffectiveRange: Record<
  WeaponType,
  Record<SightType, number>
> = {
  [WeaponType.AssaultRifle]: {
    [SightType.Scope]: 400,
    [SightType.RedDot]: 300,
    [SightType.IronSights]: 250,
  },
  [WeaponType.LightMachineGun]: {
    [SightType.Scope]: 500,
    [SightType.RedDot]: 400,
    [SightType.IronSights]: 350,
  },
  [WeaponType.GrenadeLauncher]: {
    [SightType.Scope]: 200,
    [SightType.RedDot]: 150,
    [SightType.IronSights]: 100,
  },
  [WeaponType.SniperRifle]: {
    [SightType.Scope]: 800,
    [SightType.RedDot]: 600,
    [SightType.IronSights]: 500,
  },
  [WeaponType.Pistol]: {
    [SightType.Scope]: 75,
    [SightType.RedDot]: 50,
    [SightType.IronSights]: 40,
  },
  [WeaponType.SMG]: {
    [SightType.Scope]: 300,
    [SightType.RedDot]: 200,
    [SightType.IronSights]: 150,
  },
};

// Aimed shots per minute. Not cyclic rate — this is the rate a unit actually
// puts effective fire on a target with.
export const weaponRateOfFire: Record<WeaponType, number> = {
  [WeaponType.AssaultRifle]: 60,
  [WeaponType.LightMachineGun]: 90,
  [WeaponType.GrenadeLauncher]: 12,
  [WeaponType.SniperRifle]: 20,
  [WeaponType.Pistol]: 45,
  [WeaponType.SMG]: 75,
};

/** Chance to hit at point-blank range, before any range falloff. */
export const BASE_HIT_CHANCE = 0.95;

/** Chance to hit at the very edge of a weapon's effective range. */
export const MAX_RANGE_HIT_CHANCE = 0.25;

/**
 * Probability of a hit at `meters` for a weapon with `effectiveRange`.
 * Zero beyond effective range — a unit simply does not take the shot.
 */
export function hitChance(meters: number, effectiveRange: number): number {
  if (meters > effectiveRange) return 0;
  if (effectiveRange <= 0) return 0;

  const ratio = Math.min(1, Math.max(0, meters / effectiveRange));
  return BASE_HIT_CHANCE - (BASE_HIT_CHANCE - MAX_RANGE_HIT_CHANCE) * ratio;
}

/** Rounds per magazine. */
export const weaponMagazineSize: Record<WeaponType, number> = {
  [WeaponType.AssaultRifle]: 30,
  [WeaponType.LightMachineGun]: 100,
  [WeaponType.GrenadeLauncher]: 1,
  [WeaponType.SniperRifle]: 10,
  [WeaponType.Pistol]: 15,
  [WeaponType.SMG]: 30,
};

/** Simulated seconds to swap a magazine. */
export const weaponReloadSeconds: Record<WeaponType, number> = {
  [WeaponType.AssaultRifle]: 2.5,
  [WeaponType.LightMachineGun]: 6,
  [WeaponType.GrenadeLauncher]: 4,
  [WeaponType.SniperRifle]: 3.5,
  [WeaponType.Pistol]: 2,
  [WeaponType.SMG]: 2.2,
};
