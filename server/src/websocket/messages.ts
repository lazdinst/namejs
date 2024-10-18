import { WebSocket, Server as WebSocketServer } from "ws";
import { Game } from "../game/Game";
import { broadcastGameState } from "./broadcast";

// Updated handler to use the Game instance
export const handleMessage = (
  ws: WebSocket,
  message: string,
  wss: WebSocketServer,
  game: Game
): void => {
  try {
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.type === "command") {
      // Use the game instance to process the command
      game.processCommand(parsedMessage.data);
      // Broadcast updated game state to all connected clients
      broadcastGameState(wss, game);
    } else {
      console.error("Unknown message type:", parsedMessage.type);
    }
  } catch (error) {
    console.error("Error processing message:", error);
    ws.send(
      JSON.stringify({ type: "error", message: "Invalid message format" })
    );
  }
};
