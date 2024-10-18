export enum Role {
  SquadLeader = "squadLeader",
  Rifleman = "rifleman",
  LightMachineGunner = "lightMachineGunner",
  Grenadier = "grenadier",
  Recon = "recon",
}

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

export interface UnitType {
  id: string;
  position: [number, number];
  health: number;
  status: "idle" | "engaged" | "moving";
  role: Role;
  inventory: InventoryType;
  bodyParts: BodyPart[];
  primaryWeapon: WeaponType;
  secondaryWeapon: WeaponType;
  primaryWeaponSight: SightType;
  secondaryWeaponSight: SightType;
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
