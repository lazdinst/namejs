import { WebSocket, Server as WebSocketServer } from "ws";
import { handleMessage } from "./messages";
import { broadcastGameState } from "./broadcast";
import { getGameState } from "../game/gameState";

export const handleConnection = (ws: WebSocket, wss: WebSocketServer): void => {
  console.log("A user connected");

  // Send the initial game state to the new client
  ws.send(JSON.stringify({ type: "gameState", data: getGameState() }));

  // Listen for incoming messages
  ws.on("message", (message: string) => handleMessage(ws, message, wss));

  ws.on("close", () => {
    console.log("A user disconnected");
  });
};
