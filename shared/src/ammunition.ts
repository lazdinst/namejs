import { WeaponType } from "./weapons";

export enum AmmunitionType {
  RifleAmmo = "rifleAmmo",
  LMGAmmo = "lmgAmmo",
  Grenade = "grenade",
  SniperAmmo = "sniperAmmo",
  PistolAmmo = "pistolAmmo",
  SMGAmmo = "smgAmmo",
}

// Ammunition properties for each type
export const ammunitionProperties: Record<AmmunitionType, { damage: number }> =
  {
    [AmmunitionType.RifleAmmo]: { damage: 30 },
    [AmmunitionType.LMGAmmo]: { damage: 35 },
    [AmmunitionType.Grenade]: { damage: 100 },
    [AmmunitionType.SniperAmmo]: { damage: 90 },
    [AmmunitionType.PistolAmmo]: { damage: 15 },
    [AmmunitionType.SMGAmmo]: { damage: 25 },
  };

// Mapping each weapon type to its ammunition type
export const weaponAmmunitionType: Record<WeaponType, AmmunitionType> = {
  [WeaponType.AssaultRifle]: AmmunitionType.RifleAmmo,
  [WeaponType.LightMachineGun]: AmmunitionType.LMGAmmo,
  [WeaponType.GrenadeLauncher]: AmmunitionType.Grenade,
  [WeaponType.SniperRifle]: AmmunitionType.SniperAmmo,
  [WeaponType.Pistol]: AmmunitionType.PistolAmmo,
  [WeaponType.SMG]: AmmunitionType.SMGAmmo,
};
