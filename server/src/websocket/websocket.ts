import { Server as WebSocketServer, WebSocket } from "ws";
import { Server as HTTPServer } from "http";
import { handleConnection } from "./handlers";
import { Game } from "../game/Game";

export const setupWebSocket = (server: HTTPServer, game: Game): void => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    // Pass the game instance when handling a new connection
    handleConnection(ws, wss, game);
  });
};
