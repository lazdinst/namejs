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

export const platoonFactions = Object.values(PlatoonFaction);

export enum PlatoonStrategy {
  AGGRESSIVE = "aggressive",
  DEFENSIVE = "defensive",
  PATROL = "patrol",
}
