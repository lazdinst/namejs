import { Command } from "./game";
export interface WebSocketMessage {
  type: string;
  data?: any;
}

export interface CommandMessage {
  type: "command";
  data: Command;
}
