import { Role } from "./unit";
import { AmmunitionType } from "./ammunition";
import { defaultWeapons } from "./weapons";
import { weaponAmmunitionType } from "./ammunition";

/** Reserve rounds held per ammunition type, outside the loaded magazine. */
export type AmmoReserve = Record<AmmunitionType, number>;

export interface InventoryType {
  ammunition: AmmoReserve;
  grenades: number;
  medicalSupplies: MedicalSupplyType;
}

export interface MedicalSupplyType {
  lightBleedingBandages: number;
  heavyBleedingBandages: number;
  healthPoints: number;
  surgicalKits: number;
}

const emptyReserve = (): AmmoReserve => ({
  [AmmunitionType.RifleAmmo]: 0,
  [AmmunitionType.LMGAmmo]: 0,
  [AmmunitionType.Grenade]: 0,
  [AmmunitionType.SniperAmmo]: 0,
  [AmmunitionType.PistolAmmo]: 0,
  [AmmunitionType.SMGAmmo]: 0,
});

/**
 * Rounds each role carries for its primary and secondary weapons. The reserve
 * is keyed by ammunition type, so a grenadier's rifle rounds and its 40 mm
 * grenades are tracked separately rather than drawn from one pool.
 */
const carriedRounds: Record<Role, { primary: number; secondary: number }> = {
  [Role.SquadLeader]: { primary: 180, secondary: 45 },
  [Role.Rifleman]: { primary: 240, secondary: 30 },
  [Role.LightMachineGunner]: { primary: 400, secondary: 30 },
  [Role.Grenadier]: { primary: 180, secondary: 12 },
  [Role.Recon]: { primary: 60, secondary: 120 },
  [Role.Medic]: { primary: 120, secondary: 45 },
};

const inventoryForRole = (role: Role): InventoryType => {
  const weapons = defaultWeapons[role];
  const reserve = emptyReserve();

  reserve[weaponAmmunitionType[weapons.primaryWeapon]] +=
    carriedRounds[role].primary;
  reserve[weaponAmmunitionType[weapons.secondaryWeapon]] +=
    carriedRounds[role].secondary;

  return {
    ammunition: reserve,
    grenades: medicalAndGrenades[role].grenades,
    medicalSupplies: medicalAndGrenades[role].medicalSupplies,
  };
};

const medicalAndGrenades: Record<
  Role,
  { grenades: number; medicalSupplies: MedicalSupplyType }
> = {
  [Role.SquadLeader]: {
    grenades: 2,
    medicalSupplies: {
      lightBleedingBandages: 3,
      heavyBleedingBandages: 2,
      healthPoints: 3,
      surgicalKits: 1,
    },
  },
  [Role.Rifleman]: {
    grenades: 1,
    medicalSupplies: {
      lightBleedingBandages: 2,
      heavyBleedingBandages: 1,
      healthPoints: 1,
      surgicalKits: 0,
    },
  },
  [Role.LightMachineGunner]: {
    grenades: 0,
    medicalSupplies: {
      lightBleedingBandages: 1,
      heavyBleedingBandages: 1,
      healthPoints: 1,
      surgicalKits: 0,
    },
  },
  [Role.Grenadier]: {
    grenades: 5,
    medicalSupplies: {
      lightBleedingBandages: 2,
      heavyBleedingBandages: 2,
      healthPoints: 2,
      surgicalKits: 1,
    },
  },
  [Role.Recon]: {
    grenades: 1,
    medicalSupplies: {
      lightBleedingBandages: 1,
      heavyBleedingBandages: 1,
      healthPoints: 1,
      surgicalKits: 0,
    },
  },
  // The reason to keep one alive.
  [Role.Medic]: {
    grenades: 0,
    medicalSupplies: {
      lightBleedingBandages: 12,
      heavyBleedingBandages: 8,
      healthPoints: 6,
      surgicalKits: 3,
    },
  },
};

// Default inventory for each role
export const defaultInventory: Record<Role, InventoryType> = {
  [Role.SquadLeader]: inventoryForRole(Role.SquadLeader),
  [Role.Rifleman]: inventoryForRole(Role.Rifleman),
  [Role.LightMachineGunner]: inventoryForRole(Role.LightMachineGunner),
  [Role.Grenadier]: inventoryForRole(Role.Grenadier),
  [Role.Recon]: inventoryForRole(Role.Recon),
  [Role.Medic]: inventoryForRole(Role.Medic),
};
