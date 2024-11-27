import { InventoryType } from "./inventory";
import { WeaponType, SightType } from "./weapons";
import { Coordinate } from "./location";

export enum Role {
  SquadLeader = "squadLeader",
  Rifleman = "rifleman",
  LightMachineGunner = "lightMachineGunner",
  Grenadier = "grenadier",
  Recon = "recon",
}

export interface UnitType {
  id: string;
  position: Coordinate;
  health: number;
  healthStatus: HealthStatus;
  status: UnitStatusType;
  role: Role;
  inventory: InventoryType;
  bodyParts: BodyPart[];
  primaryWeapon: WeaponType;
  secondaryWeapon: WeaponType;
  primaryWeaponSight: SightType;
  secondaryWeaponSight: SightType;
}

export enum UnitStatusType {
  Idle = "Idle",
  Engaged = "engaged",
  Moving = "moving",
}

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
