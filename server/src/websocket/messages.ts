import { WebSocket, Server as WebSocketServer } from 'ws';
import { updateGameState } from '../game/gameLogic';
import { broadcastGameState } from './broadcast';

export const handleMessage = (ws: WebSocket, message: string, wss: WebSocketServer): void => {
  try {
    const parsedMessage = JSON.parse(message);
    
    if (parsedMessage.type === 'command') {
      updateGameState(parsedMessage.data);
      broadcastGameState(wss);
    } else {
      console.error('Unknown message type:', parsedMessage.type);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
  }
};
