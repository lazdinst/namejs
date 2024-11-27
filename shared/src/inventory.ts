import { Role } from "./unit";

export interface InventoryType {
  ammunition: number;
  grenades: number;
  medicalSupplies: MedicalSupplyType;
}

export interface MedicalSupplyType {
  lightBleedingBandages: number;
  heavyBleedingBandages: number;
  healthPoints: number;
  surgicalKits: number;
}

// Default inventory for each role
export const defaultInventory: Record<Role, InventoryType> = {
  [Role.SquadLeader]: {
    ammunition: 100,
    grenades: 2,
    medicalSupplies: {
      lightBleedingBandages: 3,
      heavyBleedingBandages: 2,
      healthPoints: 3,
      surgicalKits: 1,
    },
  },
  [Role.Rifleman]: {
    ammunition: 150,
    grenades: 1,
    medicalSupplies: {
      lightBleedingBandages: 2,
      heavyBleedingBandages: 1,
      healthPoints: 1,
      surgicalKits: 0,
    },
  },
  [Role.LightMachineGunner]: {
    ammunition: 300,
    grenades: 0,
    medicalSupplies: {
      lightBleedingBandages: 1,
      heavyBleedingBandages: 1,
      healthPoints: 1,
      surgicalKits: 0,
    },
  },
  [Role.Grenadier]: {
    ammunition: 80,
    grenades: 5,
    medicalSupplies: {
      lightBleedingBandages: 2,
      heavyBleedingBandages: 2,
      healthPoints: 2,
      surgicalKits: 1,
    },
  },
  [Role.Recon]: {
    ammunition: 100,
    grenades: 1,
    medicalSupplies: {
      lightBleedingBandages: 1,
      heavyBleedingBandages: 1,
      healthPoints: 1,
      surgicalKits: 0,
    },
  },
};
