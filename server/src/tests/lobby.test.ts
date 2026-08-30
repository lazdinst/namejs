import { describe, it, expect } from "vitest";
import { PlatoonFaction, Mos, DRAFT_SECONDS, defaultLoadout } from "shared";
import { Game } from "../game/Game";
import { Lobby } from "../game/Lobby";

const seeded = (n: number) => () => {
  n = (n * 1103515245 + 12345) % 2147483648;
  return n / 2147483648;
};

/** A lobby on a clock we control. */
const setup = () => {
  let now = 1_000_000;
  const game = new Game(20, seeded(3));
  const lobby = new Lobby(game, () => now);
  const advance = (ms: number) => { now += ms; lobby.tickClock(); };
  const ids = (mos: Mos) => game.getRoster().filter((s) => s.mos === mos).map((s) => s.id);
  const legalPicks = (player: string, nth: number) => {
    for (const mos of [Mos.A18, Mos.B18, Mos.C18, Mos.D18]) {
      lobby.pick(player, ids(mos)[nth]);
    }
  };
  return { game, lobby, advance, ids, legalPicks };
};

describe("joining", () => {
  it("starts empty and waiting", () => {
    const { lobby } = setup();
    expect(lobby.getState().phase).toBe("waiting");
    expect(lobby.getState().players).toHaveLength(0);
  });

  it("seats a player on a faction", () => {
    const { lobby } = setup();
    expect(lobby.join("p1", PlatoonFaction.USEC).ok).toBe(true);
    expect(lobby.getState().players[0].faction).toBe(PlatoonFaction.USEC);
  });

  it("refuses a taken faction", () => {
    const { lobby } = setup();
    lobby.join("p1", PlatoonFaction.USEC);
    const r = lobby.join("p2", PlatoonFaction.USEC);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/taken/);
  });

  it("refuses the same player twice", () => {
    const { lobby } = setup();
    lobby.join("p1", PlatoonFaction.USEC);
    expect(lobby.join("p1", PlatoonFaction.BEAR).ok).toBe(false);
  });

  it("opens the draft once both seats are filled", () => {
    const { lobby } = setup();
    lobby.join("p1", PlatoonFaction.USEC);
    expect(lobby.getState().phase).toBe("waiting");
    lobby.join("p2", PlatoonFaction.BEAR);
    expect(lobby.getState().phase).toBe("draft");
    expect(lobby.getState().draftDeadline).not.toBeNull();
  });

  it("lets a waiting player leave, but not once the draft is open", () => {
    const { lobby } = setup();
    lobby.join("p1", PlatoonFaction.USEC);
    lobby.leave("p1");
    expect(lobby.getState().players).toHaveLength(0);

    lobby.join("p1", PlatoonFaction.USEC);
    lobby.join("p2", PlatoonFaction.BEAR);
    lobby.leave("p1");
    expect(lobby.getState().players).toHaveLength(2);
  });
});

describe("the draft", () => {
  const inDraft = () => {
    const s = setup();
    s.lobby.join("p1", PlatoonFaction.USEC);
    s.lobby.join("p2", PlatoonFaction.BEAR);
    return s;
  };

  it("does not allow picks before the draft opens", () => {
    const { lobby, ids } = setup();
    lobby.join("p1", PlatoonFaction.USEC);
    expect(lobby.pick("p1", ids(Mos.A18)[0]).ok).toBe(false);
  });

  it("lets each player pick from the board", () => {
    const { lobby, ids } = inDraft();
    expect(lobby.pick("p1", ids(Mos.A18)[0]).ok).toBe(true);
    expect(lobby.getState().players[0].slots).toHaveLength(1);
  });

  it("removes a picked man from the other player's board", () => {
    const { lobby, ids } = inDraft();
    lobby.pick("p1", ids(Mos.F18)[0]);
    const r = lobby.pick("p2", ids(Mos.F18)[0]);
    expect(r.ok).toBe(false);
    expect(lobby.getState().taken).toContain(ids(Mos.F18)[0]);
  });

  it("lets a player put a man back", () => {
    const { lobby, ids } = inDraft();
    lobby.pick("p1", ids(Mos.F18)[0]);
    lobby.unpick("p1", ids(Mos.F18)[0]);
    expect(lobby.getState().taken).not.toContain(ids(Mos.F18)[0]);
    expect(lobby.pick("p2", ids(Mos.F18)[0]).ok).toBe(true);
  });

  it("accepts a legal loadout and refuses an illegal one", () => {
    const { lobby, ids } = inDraft();
    const id = ids(Mos.C18)[0];
    lobby.pick("p1", id);
    expect(lobby.setLoadout("p1", id, { ...defaultLoadout(Mos.C18), fragGrenades: 5 }).ok).toBe(true);
    expect(lobby.setLoadout("p1", id, { ...defaultLoadout(Mos.C18), fragGrenades: 99 }).ok).toBe(false);
  });

  it("will not ready an illegal element", () => {
    const { lobby, ids } = inDraft();
    lobby.pick("p1", ids(Mos.B18)[0]);
    const r = lobby.ready("p1");
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/lead|medic|at least/);
  });

  it("readies a legal element and freezes its picks", () => {
    const { lobby, ids, legalPicks } = inDraft();
    legalPicks("p1", 0);
    expect(lobby.ready("p1").ok).toBe(true);
    expect(lobby.pick("p1", ids(Mos.E18)[0]).ok).toBe(false);
    expect(lobby.getState().phase).toBe("draft"); // still waiting on p2
  });

  it("moves to landing once both are ready", () => {
    const { lobby, legalPicks } = inDraft();
    legalPicks("p1", 0);
    legalPicks("p2", 1);
    lobby.ready("p1");
    lobby.ready("p2");
    expect(lobby.getState().phase).toBe("landing");
    expect(lobby.getState().draftDeadline).toBeNull();
  });

  it("closes on the clock, completing anyone who was not ready", () => {
    const { lobby, advance, legalPicks } = inDraft();
    legalPicks("p1", 0);
    lobby.ready("p1");
    // p2 picked nothing.

    advance(DRAFT_SECONDS * 1000 - 1);
    expect(lobby.getState().phase).toBe("draft");

    advance(2);
    const state = lobby.getState();
    expect(state.phase).toBe("landing");
    const p2 = state.players[1];
    expect(p2.ready).toBe(true);
    expect(p2.slots.length).toBeGreaterThanOrEqual(4);
    expect(p2.slots.some((s) => s.soldier.mos === Mos.D18)).toBe(true);
    expect(p2.slots.some((s) => [Mos.A18, Mos.Z18].includes(s.soldier.mos))).toBe(true);
  });

  it("auto-completion never hands out a man the other player took", () => {
    const { lobby, advance, legalPicks } = inDraft();
    legalPicks("p1", 0);
    lobby.ready("p1");
    advance(DRAFT_SECONDS * 1000 + 1);
    const [p1, p2] = lobby.getState().players;
    const a = new Set(p1.slots.map((s) => s.soldier.id));
    expect(p2.slots.every((s) => !a.has(s.soldier.id))).toBe(true);
  });
});

describe("landing and launch", () => {
  const inLanding = () => {
    const s = setup();
    s.lobby.join("p1", PlatoonFaction.USEC);
    s.lobby.join("p2", PlatoonFaction.BEAR);
    s.legalPicks("p1", 0);
    s.legalPicks("p2", 1);
    s.lobby.ready("p1");
    s.lobby.ready("p2");
    return s;
  };

  it("refuses a landing zone before the landing phase", () => {
    const { lobby } = setup();
    lobby.join("p1", PlatoonFaction.USEC);
    expect(lobby.chooseLandingZone("p1", "LZ-1").ok).toBe(false);
  });

  it("refuses an unknown zone", () => {
    const { lobby } = inLanding();
    expect(lobby.chooseLandingZone("p1", "LZ-99").ok).toBe(false);
  });

  it("waits for both zones before launching", () => {
    const { lobby, game } = inLanding();
    lobby.chooseLandingZone("p1", "LZ-1");
    expect(lobby.getState().phase).toBe("landing");
    expect(game.getFlights()).toHaveLength(0);
  });

  it("launches both elements against an empty field once both have chosen", () => {
    const { lobby, game } = inLanding();
    lobby.chooseLandingZone("p1", "LZ-1");
    lobby.chooseLandingZone("p2", "LZ-4");

    expect(lobby.getState().phase).toBe("deployed");
    expect(game.getPlatoons()).toHaveLength(0); // seeded ones gone; ours in the air
    expect(game.getFlights()).toHaveLength(2);
    expect(game.getFlights().map((f) => f.faction).sort()).toEqual(["bear", "usec"]);
    expect(game.isTicking()).toBe(true);
    game.pause();
  });

  it("lands them and they fight for the ground", () => {
    const { lobby, game } = inLanding();
    lobby.chooseLandingZone("p1", "LZ-1");
    lobby.chooseLandingZone("p2", "LZ-4");
    game.pause();

    for (let i = 0; i < 600 && game.getFlights().length; i += 1) game.tick();
    expect(game.getPlatoons()).toHaveLength(2);
    expect(game.getPlatoons().map((p) => p.name).sort()).toEqual(["ODA 0321", "ODA 0322"]);
    for (let i = 0; i < 20; i += 1) game.tick();
    expect(game.getPlatoons().every((p) => p.assignedObjectiveId)).toBe(true);
  });

  it("resets to an empty lobby", () => {
    const { lobby } = inLanding();
    lobby.reset();
    expect(lobby.getState().phase).toBe("waiting");
    expect(lobby.getState().players).toHaveLength(0);
  });

  it("rematch tears the finished match down and reopens the lobby", () => {
    const { lobby, game } = inLanding();
    lobby.chooseLandingZone("p1", "LZ-1");
    lobby.chooseLandingZone("p2", "LZ-4");
    game.pause();

    const result = lobby.rematch();

    expect(result.ok).toBe(true);
    expect(lobby.getState().phase).toBe("waiting");
    expect(lobby.getState().players).toHaveLength(0);
    expect(game.getOutcome()).toBeNull();
    expect(game.getFlights()).toHaveLength(0);
    expect(game.isTicking()).toBe(false);
    expect(game.getRoster().length).toBeGreaterThan(0);
  });

  it("the same seats can be taken again and a fresh draft opened", () => {
    const { lobby } = inLanding();
    lobby.chooseLandingZone("p1", "LZ-1");
    lobby.chooseLandingZone("p2", "LZ-4");
    lobby.rematch();

    expect(lobby.join("p1", PlatoonFaction.BEAR).ok).toBe(true);
    expect(lobby.join("p2", PlatoonFaction.USEC).ok).toBe(true);
    expect(lobby.getState().phase).toBe("draft");
  });
});
