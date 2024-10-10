import http from 'http';
import app from '../app/app';
import { setupWebSocket } from '../websocket/websocket';
import { SERVER_PORT } from '../config/constants';

const server = http.createServer(app);

setupWebSocket(server);

server.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
});

export default server;
