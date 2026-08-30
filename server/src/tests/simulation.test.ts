import { describe, it, expect, vi } from "vitest";
import {
  distanceMeters,
  moveTowards,
  isWithin,
  speedMultiplierAt,
  Coordinate,
  PlatoonStrategy,
  UnitStatusType,
  Role,
} from "shared";
import { Game, TICK_HZ, BROADCAST_EVERY_N_TICKS } from "../game/Game";
import { Unit } from "../game/Unit";
import { parseCommand, applyCommand } from "../game/commands";

describe("geodesic helpers", () => {
  it("measures one degree of latitude at ~111 km", () => {
    expect(distanceMeters([0, 0], [1, 0])).toBeCloseTo(111_195, -2);
  });

  it("measures one degree of longitude at the equator at ~111 km", () => {
    expect(distanceMeters([0, 0], [0, 1])).toBeCloseTo(111_195, -2);
  });

  it("shrinks a degree of longitude with latitude", () => {
    const atEquator = distanceMeters([0, 0], [0, 1]);
    const atLatvia = distanceMeters([57, 0], [57, 1]);

    expect(atLatvia).toBeLessThan(atEquator);
    expect(atLatvia).toBeCloseTo(atEquator * Math.cos((57 * Math.PI) / 180), -2);
  });

  it("returns zero for identical points", () => {
    expect(distanceMeters([57.1, 26.8], [57.1, 26.8])).toBe(0);
  });

  it("measures the old seed spread in tens of kilometres, not fractions", () => {
    // Regression: this used to be computed as Manhattan distance in degrees,
    // giving ~0.9 and pinning every damage calculation at its maximum.
    const meters = distanceMeters([57.1, 26.8], [58.0, 27.7]);

    expect(meters).toBeGreaterThan(60_000);
    expect(meters).toBeLessThan(120_000);
  });
});

describe("moveTowards", () => {
  const from: Coordinate = [57.0, 27.0];
  const to: Coordinate = [57.5, 27.0];

  it("covers exactly the requested distance", () => {
    const next = moveTowards(from, to, 1_000);
    expect(distanceMeters(from, next)).toBeCloseTo(1_000, 0);
  });

  it("lands on the target rather than overshooting", () => {
    expect(moveTowards(from, to, 10_000_000)).toEqual(to);
  });

  it("does not move on a zero or negative step", () => {
    expect(moveTowards(from, to, 0)).toEqual(from);
    expect(moveTowards(from, to, -5)).toEqual(from);
  });

  it("converges when applied repeatedly", () => {
    let position = from;
    for (let i = 0; i < 200; i += 1) {
      position = moveTowards(position, to, 500);
    }
    expect(isWithin(position, to, 1)).toBe(true);
  });
});

describe("Unit.advance", () => {
  it("walks toward its destination at its own speed", () => {
    const unit = new Unit("u", [57.0, 27.0], Role.Rifleman);
    unit.setDestination([57.5, 27.0]);

    const covered = unit.advance(10);

    expect(covered).toBeCloseTo(unit.speedMetersPerSecond * 10, 5);
    expect(unit.status).toBe(UnitStatusType.Moving);
  });

  it("gives a machine gunner less ground than a recon element", () => {
    const gunner = new Unit("g", [57.0, 27.0], Role.LightMachineGunner);
    const recon = new Unit("r", [57.0, 27.0], Role.Recon);
    gunner.setDestination([57.5, 27.0]);
    recon.setDestination([57.5, 27.0]);

    expect(gunner.advance(60)).toBeLessThan(recon.advance(60));
  });

  it("stops and goes idle on arrival", () => {
    const unit = new Unit("u", [57.0, 27.0], Role.Rifleman);
    unit.setDestination([57.0001, 27.0]);

    for (let i = 0; i < 100; i += 1) unit.advance(10);

    expect(unit.destination).toBeNull();
    expect(unit.status).toBe(UnitStatusType.Idle);
    expect(isWithin(unit.position, [57.0001, 27.0], 1)).toBe(true);
  });

  it("does not move without a destination", () => {
    const unit = new Unit("u", [57.0, 27.0], Role.Rifleman);
    expect(unit.advance(60)).toBe(0);
    expect(unit.position).toEqual([57.0, 27.0]);
  });

  it("does not move once KIA", () => {
    const unit = new Unit("u", [57.0, 27.0], Role.Rifleman);
    unit.setDestination([57.5, 27.0]);
    unit.takeDamage(9999);

    expect(unit.advance(60)).toBe(0);
    expect(unit.destination).toBeNull();
  });
});

describe("Game tick loop", () => {
  it("advances a unit a predictable distance per tick", () => {
    const game = new Game(1); // 1× time scale, so one tick is 0.1 simulated seconds
    const unit = game.getPlatoons()[0].units[0];
    const start: Coordinate = [...unit.position] as Coordinate;
    unit.setDestination([58.5, 28.0]);

    game.tick();

    // Ground underfoot scales the step, so the terrain there is part of the sum.
    const expected =
      unit.speedMetersPerSecond * speedMultiplierAt(start) * (1 / TICK_HZ);

    expect(distanceMeters(start, unit.position)).toBeCloseTo(expected, 4);
    expect(game.getTickCount()).toBe(1);
  });

  it("scales simulated time by the time scale", () => {
    const slow = new Game(1);
    const fast = new Game(10);

    const origins = new Map<Game, Coordinate>();

    for (const game of [slow, fast]) {
      const unit = game.getPlatoons()[0].units[0];
      origins.set(game, [...unit.position] as Coordinate);
      unit.setDestination([58.5, 28.0]);
      game.tick();
    }

    const moved = (game: Game) =>
      distanceMeters(origins.get(game)!, game.getPlatoons()[0].units[0].position);

    const slowMoved = moved(slow);
    const fastMoved = moved(fast);

    expect(fastMoved / slowMoved).toBeCloseTo(10, 1);
  });

  it("broadcasts every Nth tick, not every tick", () => {
    const game = new Game();
    const listener = vi.fn();
    game.subscribe(listener);

    for (let i = 0; i < BROADCAST_EVERY_N_TICKS * 3; i += 1) game.tick();

    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("stops notifying after unsubscribe", () => {
    const game = new Game();
    const listener = vi.fn();
    const unsubscribe = game.subscribe(listener);

    unsubscribe();
    for (let i = 0; i < BROADCAST_EVERY_N_TICKS; i += 1) game.tick();

    expect(listener).not.toHaveBeenCalled();
  });

  it("reports the tick count in game state", () => {
    const game = new Game();
    game.tick();
    game.tick();

    expect(game.getGameState().tick).toBe(2);
  });
});

describe("Game lifecycle drives the loop", () => {
  it("ticks while running and freezes when paused", () => {
    vi.useFakeTimers();
    try {
      const game = new Game();
      const unit = game.getPlatoons()[0].units[0];
      unit.setDestination([58.5, 28.0]);

      game.start();
      expect(game.isTicking()).toBe(true);

      vi.advanceTimersByTime(1000);
      const afterRunning = game.getTickCount();
      expect(afterRunning).toBeGreaterThan(0);

      game.pause();
      expect(game.isTicking()).toBe(false);

      const frozen: Coordinate = [...unit.position] as Coordinate;
      vi.advanceTimersByTime(5000);

      expect(game.getTickCount()).toBe(afterRunning);
      expect(unit.position).toEqual(frozen);
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns units to spawn and stops the loop on reset", () => {
    vi.useFakeTimers();
    try {
      const game = new Game();
      const spawn = [...game.getPlatoons()[0].units[0].position] as Coordinate;

      game.start();
      game.getPlatoons()[0].units[0].setDestination([58.5, 28.0]);
      vi.advanceTimersByTime(2000);

      expect(game.getPlatoons()[0].units[0].position).not.toEqual(spawn);

      game.reset();

      expect(game.isTicking()).toBe(false);
      expect(game.getTickCount()).toBe(0);
      expect(game.getPlatoons()[0].units[0].position).toEqual(spawn);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("command queue", () => {
  it("applies queued commands at the tick boundary, not on enqueue", () => {
    const game = new Game();
    game.enqueueCommand({
      action: "move",
      platoonId: "usec-1",
      unitId: "unit1",
      newPosition: [57.9, 27.5],
    });

    expect(game.getPlatoons()[0].units[0].destination).toBeNull();
    expect(game.pendingCommandCount()).toBe(1);

    game.tick();

    expect(game.getPlatoons()[0].units[0].destination).toEqual([57.9, 27.5]);
    expect(game.pendingCommandCount()).toBe(0);
  });

  it("changes platoon strategy through a command", () => {
    const game = new Game();
    game.enqueueCommand({
      action: "changeStrategy",
      platoonId: "usec-1",
      unitId: "",
      newStrategy: PlatoonStrategy.DEFENSIVE,
    });
    game.tick();

    expect(game.getPlatoons()[0].strategy).toBe(PlatoonStrategy.DEFENSIVE);
  });
});

describe("command validation", () => {
  it("accepts a well-formed move", () => {
    expect(
      parseCommand({ action: "move", unitId: "unit1", newPosition: [57, 27] })
    ).toMatchObject({ action: "move", unitId: "unit1" });
  });

  it.each([
    ["a non-object", "nope"],
    ["an unknown action", { action: "detonate", unitId: "unit1" }],
    ["a missing position", { action: "move", unitId: "unit1" }],
    ["a non-numeric position", { action: "move", unitId: "u", newPosition: ["a", "b"] }],
    ["a three-element position", { action: "move", unitId: "u", newPosition: [1, 2, 3] }],
    ["an out-of-range latitude", { action: "move", unitId: "u", newPosition: [91, 0] }],
    ["an out-of-range longitude", { action: "move", unitId: "u", newPosition: [0, 181] }],
    ["a bogus strategy", { action: "changeStrategy", platoonId: "usec-1", newStrategy: "yolo" }],
  ])("rejects %s", (_label, payload) => {
    expect(parseCommand(payload)).toBeNull();
  });

  it("refuses to order a KIA unit to move", () => {
    const game = new Game();
    const unit = game.getPlatoons()[0].units[0];
    unit.takeDamage(9999);

    const result = applyCommand(
      { action: "move", platoonId: "usec-1", unitId: unit.id, newPosition: [57.9, 27.5] },
      game.getPlatoons()
    );

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/KIA/);
  });

  it("reports an unknown unit", () => {
    const game = new Game();
    const result = applyCommand(
      { action: "move", platoonId: "usec-1", unitId: "ghost", newPosition: [57.9, 27.5] },
      game.getPlatoons()
    );

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/not found/);
  });
});
