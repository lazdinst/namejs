import { WebSocket, Server as WebSocketServer } from "ws";
import { handleMessage } from "./messages";
import { broadcastGameState } from "./broadcast";
import { Game } from "../game/Game";

export const handleConnection = (
  ws: WebSocket,
  wss: WebSocketServer,
  game: Game
): void => {
  console.log("A user connected");

  // Send the joining client the current state immediately, rather than making
  // it wait up to a broadcast interval for the next tick.
  broadcastGameState(wss, game);

  ws.on("message", (message: string) => handleMessage(ws, message, wss, game));

  ws.on("close", () => {
    console.log("A user disconnected");
  });
};
