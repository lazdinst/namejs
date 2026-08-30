import { describe, it, expect, vi } from "vitest";
import { WebSocket } from "ws";
import { handleMessage } from "../websocket/messages";
import { broadcastGameState } from "../websocket/broadcast";
import { Game } from "../game/Game";

type FakeClient = { readyState: number; send: ReturnType<typeof vi.fn> };

const makeWss = (clients: FakeClient[]) =>
  ({ clients: new Set(clients) } as never);

const openClient = (): FakeClient => ({
  readyState: WebSocket.OPEN,
  send: vi.fn(),
});

describe("broadcastGameState", () => {
  it("sends the full game state to every open client", () => {
    const a = openClient();
    const b = openClient();
    const game = new Game();

    broadcastGameState(makeWss([a, b]), game);

    for (const client of [a, b]) {
      expect(client.send).toHaveBeenCalledOnce();
      const payload = JSON.parse(client.send.mock.calls[0][0]);
      expect(payload.type).toBe("gameState");
      expect(payload.payload.platoons).toHaveLength(2);
    }
  });

  it("skips clients that are not open", () => {
    const closed = { readyState: WebSocket.CLOSED, send: vi.fn() };

    broadcastGameState(makeWss([closed]), new Game());

    expect(closed.send).not.toHaveBeenCalled();
  });
});

describe("handleMessage", () => {
  const validMove = {
    type: "command",
    data: { action: "move", unitId: "unit1", newPosition: [57.9, 27.5] },
  };

  it("queues a valid command on the game", () => {
    const game = new Game();
    const ws = { send: vi.fn() } as never;

    handleMessage(ws, JSON.stringify(validMove), makeWss([]), game);

    expect(game.pendingCommandCount()).toBe(1);
  });

  it("acknowledges with current state while the loop is stopped", () => {
    const client = openClient();
    const ws = { send: vi.fn() } as never;

    handleMessage(ws, JSON.stringify(validMove), makeWss([client]), new Game());

    expect(client.send).toHaveBeenCalledOnce();
  });

  it("stays quiet while the loop is running, letting the tick broadcast", () => {
    const client = openClient();
    const ws = { send: vi.fn() } as never;
    const game = new Game();
    game.start();

    try {
      handleMessage(ws, JSON.stringify(validMove), makeWss([client]), game);
      expect(client.send).not.toHaveBeenCalled();
    } finally {
      game.pause();
    }
  });

  it("replies with an error on malformed JSON", () => {
    const ws = { send: vi.fn() };

    handleMessage(ws as never, "not json", makeWss([]), new Game());

    const payload = JSON.parse(ws.send.mock.calls[0][0]);
    expect(payload.type).toBe("error");
  });

  it("rejects a command that fails validation instead of queueing it", () => {
    const game = new Game();
    const ws = { send: vi.fn() };

    handleMessage(
      ws as never,
      JSON.stringify({ type: "command", data: { action: "move" } }),
      makeWss([]),
      game
    );

    expect(game.pendingCommandCount()).toBe(0);
    expect(JSON.parse(ws.send.mock.calls[0][0]).type).toBe("error");
  });

  it("rejects an unknown message type", () => {
    const ws = { send: vi.fn() };

    handleMessage(
      ws as never,
      JSON.stringify({ type: "chat", data: {} }),
      makeWss([]),
      new Game()
    );

    expect(JSON.parse(ws.send.mock.calls[0][0]).type).toBe("error");
  });
});
