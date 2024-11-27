import { PlatoonType } from "./platoon";

export interface GameStateType {
  status: GameStatus;
  platoons: PlatoonType[];
}

export enum GameStatus {
  NOT_STARTED = "not_started",
  RUNNING = "running",
  PAUSED = "paused",
}
