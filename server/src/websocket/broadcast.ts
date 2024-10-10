import { Server as WebSocketServer } from 'ws';
import { getGameState } from '../game/gameLogic';

export const broadcastGameState = (wss: WebSocketServer): void => {
  const gameStateMessage = JSON.stringify({ type: 'gameState', data: getGameState() });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(gameStateMessage);
    }
  });
};
