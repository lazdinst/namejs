export interface Unit {
  id: string;
  position: [number, number];
  health: number;
  status: "idle" | "engaged" | "moving";
}

export interface Platoon {
  id: string;
  units: Unit[];
  strategy: "aggressive" | "defensive" | "patrol";
}

export interface GameState {
  platoons: Platoon[];
}

export interface Command {
  action: "move" | "changeStrategy";
  platoonId: string;
  unitId: string;
  newPosition?: [number, number];
  newStrategy?: "aggressive" | "defensive" | "patrol";
}

export interface GameEvent {
  type: "engagement";
  message: string;
}
