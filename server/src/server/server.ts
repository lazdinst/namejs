import http from "http";
import app from "../app/app";
import { setupWebSocket } from "../websocket/websocket";
import { SERVER_PORT } from "../config/constants";
import { Game } from "../game/Game";

const game = new Game();

const server = http.createServer(app);

setupWebSocket(server, game);

server.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
});
export { game };
export default server;
