import { Mos, mosDefinitions } from "./mos";
import { WeaponType } from "./weapons";
import { AmmunitionType, weaponAmmunitionType } from "./ammunition";

/**
 * What a soldier carries into the fight. Every choice trades against a
 * weight budget set by his MOS, so "more grenades" costs "less ammunition".
 */
export interface Loadout {
  primaryWeapon: WeaponType;
  /** Magazines for the primary, beyond the one loaded. */
  primaryMagazines: number;
  secondaryMagazines: number;
  fragGrenades: number;
  smokeGrenades: number;
  /** Light bleed dressings. */
  bandages: number;
  /** Heavy bleed dressings — tourniquets and packing. */
  tourniquets: number;
}

/** Kilograms. Rough field weights; the ratios matter more than the digits. */
export const weaponWeightKg: Record<WeaponType, number> = {
  [WeaponType.AssaultRifle]: 3.6,
  [WeaponType.LightMachineGun]: 7.5,
  [WeaponType.GrenadeLauncher]: 1.4,
  [WeaponType.SniperRifle]: 5.5,
  [WeaponType.Pistol]: 0.9,
  [WeaponType.SMG]: 2.7,
};

/** A loaded magazine, by ammunition type. */
export const magazineWeightKg: Record<AmmunitionType, number> = {
  [AmmunitionType.RifleAmmo]: 0.5,
  [AmmunitionType.LMGAmmo]: 1.6,
  [AmmunitionType.Grenade]: 0.23,
  [AmmunitionType.SniperAmmo]: 0.35,
  [AmmunitionType.PistolAmmo]: 0.25,
  [AmmunitionType.SMGAmmo]: 0.45,
};

export const FRAG_WEIGHT_KG = 0.4;
export const SMOKE_WEIGHT_KG = 0.55;
export const BANDAGE_WEIGHT_KG = 0.05;
export const TOURNIQUET_WEIGHT_KG = 0.12;

/** Body armour, helmet, water, radio — carried by everyone, not optional. */
export const BASE_KIT_WEIGHT_KG = 11;

export interface LoadoutLimits {
  maxPrimaryMagazines: number;
  maxSecondaryMagazines: number;
  maxFrag: number;
  maxSmoke: number;
  maxBandages: number;
  maxTourniquets: number;
}

/** Hard caps regardless of weight — there are only so many pouches. */
export const loadoutLimits: LoadoutLimits = {
  maxPrimaryMagazines: 12,
  maxSecondaryMagazines: 4,
  maxFrag: 6,
  maxSmoke: 6,
  maxBandages: 10,
  maxTourniquets: 6,
};

/** The issue loadout for an MOS — what they carry if the player changes nothing. */
export function defaultLoadout(mos: Mos): Loadout {
  const def = mosDefinitions[mos];

  const byMos: Partial<Record<Mos, Partial<Loadout>>> = {
    [Mos.B18]: { primaryMagazines: 4, fragGrenades: 1, smokeGrenades: 1 },
    [Mos.C18]: { primaryMagazines: 5, fragGrenades: 4, smokeGrenades: 2 },
    [Mos.D18]: { primaryMagazines: 4, bandages: 10, tourniquets: 6, fragGrenades: 0, smokeGrenades: 2 },
    [Mos.F18]: { primaryMagazines: 5, fragGrenades: 1, smokeGrenades: 1 },
    [Mos.E18]: { primaryMagazines: 6, smokeGrenades: 3 },
  };

  return {
    primaryWeapon: def.primaryWeapon,
    primaryMagazines: 6,
    secondaryMagazines: 2,
    fragGrenades: 2,
    smokeGrenades: 1,
    bandages: 2,
    tourniquets: 1,
    ...byMos[mos],
  };
}

/** Total carried weight for a loadout, including the base kit. */
export function loadoutWeightKg(mos: Mos, loadout: Loadout): number {
  const def = mosDefinitions[mos];
  const primaryAmmo = weaponAmmunitionType[loadout.primaryWeapon];
  const secondaryAmmo = weaponAmmunitionType[def.secondaryWeapon];

  return (
    BASE_KIT_WEIGHT_KG +
    weaponWeightKg[loadout.primaryWeapon] +
    weaponWeightKg[def.secondaryWeapon] +
    // The loaded magazine counts too.
    (loadout.primaryMagazines + 1) * magazineWeightKg[primaryAmmo] +
    (loadout.secondaryMagazines + 1) * magazineWeightKg[secondaryAmmo] +
    loadout.fragGrenades * FRAG_WEIGHT_KG +
    loadout.smokeGrenades * SMOKE_WEIGHT_KG +
    loadout.bandages * BANDAGE_WEIGHT_KG +
    loadout.tourniquets * TOURNIQUET_WEIGHT_KG
  );
}

export interface LoadoutProblem {
  field: keyof Loadout | "weight";
  message: string;
}

/** Everything wrong with a loadout for this MOS. Empty means it is legal. */
export function validateLoadout(mos: Mos, loadout: Loadout): LoadoutProblem[] {
  const def = mosDefinitions[mos];
  const problems: LoadoutProblem[] = [];
  const lim = loadoutLimits;

  if (!def.allowedPrimaries.includes(loadout.primaryWeapon)) {
    problems.push({
      field: "primaryWeapon",
      message: `${def.mos} does not carry a ${loadout.primaryWeapon}`,
    });
  }

  const caps: [keyof Loadout, number][] = [
    ["primaryMagazines", lim.maxPrimaryMagazines],
    ["secondaryMagazines", lim.maxSecondaryMagazines],
    ["fragGrenades", lim.maxFrag],
    ["smokeGrenades", lim.maxSmoke],
    ["bandages", lim.maxBandages],
    ["tourniquets", lim.maxTourniquets],
  ];

  for (const [field, cap] of caps) {
    const value = loadout[field] as number;
    if (!Number.isInteger(value) || value < 0) {
      problems.push({ field, message: `${field} must be a whole number` });
    } else if (value > cap) {
      problems.push({ field, message: `${field} cannot exceed ${cap}` });
    }
  }

  const weight = loadoutWeightKg(mos, loadout);
  if (weight > def.loadCapacityKg) {
    problems.push({
      field: "weight",
      message: `${weight.toFixed(1)} kg exceeds the ${def.loadCapacityKg} kg this MOS can carry`,
    });
  }

  return problems;
}

/**
 * A movement-speed multiplier from how heavily a soldier is loaded, relative
 * to his capacity. Under 70% of capacity costs nothing; at capacity he is
 * noticeably slower. A mule with every pouch full pays for it in the approach.
 */
export function encumbranceSpeed(mos: Mos, loadout: Loadout): number {
  const fraction = loadoutWeightKg(mos, loadout) / mosDefinitions[mos].loadCapacityKg;
  if (fraction <= 0.7) return 1;
  return Math.max(0.7, 1 - (fraction - 0.7) * 0.8);
}
