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
