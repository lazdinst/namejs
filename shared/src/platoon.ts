import { UnitType } from "./unit";

export interface PlatoonType {
  id: string;
  faction: PlatoonFaction;
  units: UnitType[];
  strategy: PlatoonStrategy;
  attack: (targetPlatoon: PlatoonType) => string;
}

export enum PlatoonFaction {
  USEC = "usec",
  BEAR = "bear",
}

export type PlatoonStrategy = "aggressive" | "defensive" | "patrol";
