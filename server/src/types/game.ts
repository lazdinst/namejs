export interface UnitType {
  id: string;
  position: [number, number];
  health: number;
  status: "idle" | "engaged" | "moving";
}

export interface PlatoonType {
  id: string;
  units: UnitType[];
  strategy: "aggressive" | "defensive" | "patrol";
  attack: (targetPlatoon: PlatoonType) => string;
}

export interface GameStateType {
  platoons: PlatoonType[];
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
