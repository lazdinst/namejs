import { UnitType } from "./unit";

export interface PlatoonType {
  id: string;
  faction: "usec" | "bear";
  units: UnitType[];
  strategy: PlatoonStrategy;
  attack: (targetPlatoon: PlatoonType) => string;
}

export type PlatoonStrategy = "aggressive" | "defensive" | "patrol";
