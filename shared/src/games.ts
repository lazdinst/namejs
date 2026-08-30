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

export type GameEventKind = "hit" | "kia" | "dry" | "morale" | "comms" | "medical" | "outcome" | "objective";

/** An engagement outcome, broadcast to clients for the combat feed. */
export interface GameEventType {
  type: GameEventKind;
  message: string;
  tick: number;
}
