import { WebSocket, Server as WebSocketServer } from "ws";
import { Game } from "../game/Game";
import { parseCommand } from "../game/commands";
import { broadcastGameState } from "./broadcast";

/**
 * Handle one inbound client message. Commands are validated here and queued on
 * the game; they are applied at the next tick boundary, never mid-update.
 */
export const handleMessage = (
  ws: WebSocket,
  message: string,
  wss: WebSocketServer,
  game: Game
): void => {
  let parsedMessage: { type?: unknown; data?: unknown };

  try {
    parsedMessage = JSON.parse(message);
  } catch {
    ws.send(
      JSON.stringify({ type: "error", message: "Invalid message format" })
    );
    return;
  }

  if (parsedMessage.type !== "command") {
    ws.send(
      JSON.stringify({
        type: "error",
        message: `Unknown message type: ${String(parsedMessage.type)}`,
      })
    );
    return;
  }

  const command = parseCommand(parsedMessage.data);

  if (!command) {
    ws.send(
      JSON.stringify({ type: "error", message: "Invalid or unsupported command" })
    );
    return;
  }

  game.enqueueCommand(command);

  // When the loop is not running there is no tick to pick the command up and
  // no broadcast coming, so acknowledge with current state instead.
  if (!game.isTicking()) {
    broadcastGameState(wss, game);
  }
};
