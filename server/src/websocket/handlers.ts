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

  broadcastGameState(wss, game);

  // Listen for incoming messages
  ws.on("message", (message: string) => handleMessage(ws, message, wss, game));

  ws.on("close", () => {
    console.log("A user disconnected");
  });
};
