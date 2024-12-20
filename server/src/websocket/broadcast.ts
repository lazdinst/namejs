import { Server as WebSocketServer, WebSocket } from "ws";
import { Game } from "../game/Game";

export const broadcastGameState = (wss: WebSocketServer, game: Game): void => {
  const gameStateMessage = JSON.stringify({
    type: "gameState",
    payload: game.getGameState(),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(gameStateMessage);
    }
  });
};
