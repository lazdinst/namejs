import { GameStateMessage } from "./message.types";

// Consumed by toast action
export interface CustomAction {
  type: string;
  error?: {
    message?: string;
  };
  payload: string;
}

export type WebsocketMessage = GameStateMessage;
