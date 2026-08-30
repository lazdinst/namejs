import { Game } from "./Game";
import { Lobby } from "./Lobby";

// The single in-memory game and its lobby. Kept here, separate from server.ts,
// so importing a route (or a test) never starts a listening HTTP server.
export const game = new Game();
export const lobby = new Lobby(game);
