import { Server as WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { handleConnection } from './handlers';

export const setupWebSocket = (server: HTTPServer): void => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    handleConnection(ws, wss);
  });
};
