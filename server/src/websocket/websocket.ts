import WebSocket, { WebSocketServer } from "ws";
import { Server as HTTPServer, IncomingMessage } from "http";
import { handleConnection } from "./handlers";
import { Game } from "../game/Game";

export const setupWebSocket = (server: HTTPServer, game: Game): void => {
  // Create a WebSocket server bound to the HTTP server
  const wss = new WebSocketServer({ server });

  console.log("WebSocket server is running");

  // Handle new WebSocket connections
  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    // Log the origin of the connection, if available
    const origin = req.headers.origin || "unknown origin";
    console.log(`New WebSocket connection from: ${origin}`);

    // Pass the game instance to handle the connection
    handleConnection(ws, wss, game);

    // Handle WebSocket-specific errors
    ws.on("error", (error) => {
      console.error(`WebSocket error from ${origin}:`, error);
    });

    // Log when a WebSocket connection is closed
    ws.on("close", (code, reason) => {
      console.log(
        `WebSocket connection from ${origin} closed. Code: ${code}, Reason: ${reason}`
      );
    });
  });

  // Handle server-level errors
  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  // Log when the WebSocket server shuts down
  wss.on("close", () => {
    console.log("WebSocket server closed");
  });
};
