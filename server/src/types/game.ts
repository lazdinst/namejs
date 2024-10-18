import { UnitType } from "./unit";
export interface GameStateType {
  platoons: PlatoonType[];
}
export interface PlatoonType {
  id: string;
  units: UnitType[];
  strategy: "aggressive" | "defensive" | "patrol";
  attack: (targetPlatoon: PlatoonType) => string;
}
export interface CommandType {
  action: "move" | "changeStrategy";
  platoonId: string;
  unitId: string;
  newPosition?: [number, number];
  newStrategy?: "aggressive" | "defensive" | "patrol";
}

export interface GameEventType {
  type: "engagement";
  message: string;
}
