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

  // Send the initial game state to the new client
  ws.send(JSON.stringify({ type: "gameState", data: "Some Data" }));

  // Listen for incoming messages
  ws.on("message", (message: string) => handleMessage(ws, message, wss, game));

  ws.on("close", () => {
    console.log("A user disconnected");
  });
};
