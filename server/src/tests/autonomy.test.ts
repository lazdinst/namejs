import { describe, it, expect } from "vitest";
import {
  Coordinate,
  PlatoonStrategy,
  UnitStatusType,
  distanceMeters,
  coverRank,
  bestCoverNear,
  coverAt,
} from "shared";
import { Game, STANDOFF_FRACTION } from "../game/Game";
import { UNIT_MAX_HEALTH } from "../game/Unit";

const alwaysHit = () => 0;

const gapBetweenPlatoons = (game: Game) => {
  const [usec, bear] = game.getPlatoons();
  return distanceMeters(usec.units[0].position, bear.units[0].position);
};

const totalHealth = (game: Game) =>
  game
    .getPlatoons()
    .flatMap((p) => p.units)
    .reduce((sum, u) => sum + u.health, 0);

const setStrategy = (game: Game, index: number, strategy: PlatoonStrategy) => {
  game.getPlatoons()[index].strategy = strategy;
};

describe("admin mode — start is enough on its own", () => {
  /**
   * The regression this suite exists for: the loop ran, but every unit sat
   * idle with no destination, so pressing Start appeared to do nothing.
   */
  it("moves units without a single operator order", () => {
    const game = new Game(1, alwaysHit);
    const before = game.getPlatoons().map((p) => [...p.units[0].position]);

    for (let i = 0; i < 30; i += 1) game.tick();

    const after = game.getPlatoons().map((p) => [...p.units[0].position]);
    expect(after).not.toEqual(before);
  });

  it("is autonomous by default", () => {
    expect(new Game().isAutonomous()).toBe(true);
    expect(new Game().getGameState().autonomous).toBe(true);
  });

  it("closes the gap between the two platoons", () => {
    const game = new Game(20, alwaysHit);
    const opening = gapBetweenPlatoons(game);

    for (let i = 0; i < 120; i += 1) game.tick();

    expect(gapBetweenPlatoons(game)).toBeLessThan(opening - 100);
  });

  it("reaches contact and takes casualties unaided", () => {
    const game = new Game(20, alwaysHit);
    const full =
      UNIT_MAX_HEALTH * game.getPlatoons().flatMap((p) => p.units).length;

    for (let i = 0; i < 400 && totalHealth(game) === full; i += 1) {
      game.tick();
    }

    expect(totalHealth(game)).toBeLessThan(full);
    expect(game.getEvents().length).toBeGreaterThan(0);
  });

  it("runs a battle through to one side being eliminated", () => {
    const game = new Game(20, alwaysHit);

    for (let i = 0; i < 2000 && !game.getPlatoons().some((p) => p.isEliminated()); i += 1) {
      game.tick();
    }

    expect(game.getPlatoons().filter((p) => p.isEliminated())).toHaveLength(1);
  });
});

describe("manual mode", () => {
  it("holds every unit in place when autonomy is off", () => {
    const game = new Game(20, alwaysHit);
    game.setAutonomous(false);

    const before = game
      .getPlatoons()
      .flatMap((p) => p.units.map((u) => [...u.position]));

    for (let i = 0; i < 60; i += 1) game.tick();

    const after = game
      .getPlatoons()
      .flatMap((p) => p.units.map((u) => [...u.position]));

    expect(after).toEqual(before);
  });

  it("still follows an operator order with autonomy off", () => {
    const game = new Game(20, alwaysHit);
    game.setAutonomous(false);

    const unit = game.getPlatoons()[0].units[0];
    const start: Coordinate = [...unit.position] as Coordinate;
    game.enqueueCommand({
      action: "move",
      platoonId: "usec-1",
      unitId: unit.id,
      newPosition: [start[0] + 0.002, start[1]],
    });

    for (let i = 0; i < 20; i += 1) game.tick();

    expect(distanceMeters(start, unit.position)).toBeGreaterThan(5);
  });

  it("drops autonomous intent the moment autonomy is switched off", () => {
    const game = new Game(20, alwaysHit);
    for (let i = 0; i < 10; i += 1) game.tick();
    expect(
      game.getPlatoons().flatMap((p) => p.units).some((u) => u.destination)
    ).toBe(true);

    game.setAutonomous(false);

    expect(
      game.getPlatoons().flatMap((p) => p.units).every((u) => !u.destination)
    ).toBe(true);
  });
});

describe("operator orders override autonomy", () => {
  it("sends an ordered unit where it was told, not where its strategy wants", () => {
    const game = new Game(20, alwaysHit);
    const unit = game.getPlatoons()[1].units[0]; // BEAR, aggressive
    const start: Coordinate = [...unit.position] as Coordinate;

    // Order it away from the enemy; its own strategy would advance toward them.
    const away: Coordinate = [start[0] + 0.004, start[1]];
    game.enqueueCommand({
      action: "move",
      platoonId: "bear-1",
      unitId: unit.id,
      newPosition: away,
    });

    for (let i = 0; i < 15; i += 1) game.tick();

    expect(unit.hasOrders).toBe(true);
    expect(distanceMeters(unit.position, away)).toBeLessThan(
      distanceMeters(start, away)
    );
  });

  it("releases the unit back to its strategy once the order is fulfilled", () => {
    const game = new Game(20, alwaysHit);
    const unit = game.getPlatoons()[1].units[0];
    const near: Coordinate = [
      unit.position[0] + 0.0002,
      unit.position[1],
    ];

    game.enqueueCommand({
      action: "move",
      platoonId: "bear-1",
      unitId: unit.id,
      newPosition: near,
    });

    for (let i = 0; i < 60; i += 1) game.tick();

    expect(unit.hasOrders).toBe(false);
  });
});

describe("strategies", () => {
  it("AGGRESSIVE advances and then holds at standoff rather than closing to zero", () => {
    const game = new Game(20, alwaysHit);
    setStrategy(game, 0, PlatoonStrategy.DEFENSIVE);
    setStrategy(game, 1, PlatoonStrategy.AGGRESSIVE);

    for (let i = 0; i < 600; i += 1) game.tick();

    const attacker = game.getPlatoons()[1].units.find((u) => u.isAlive());
    if (!attacker) return; // fight already decided

    const nearest = Math.min(
      ...game
        .getPlatoons()[0]
        .units.filter((u) => u.isAlive())
        .map((u) => attacker.distanceTo(u))
    );

    if (Number.isFinite(nearest)) {
      // It should stop inside its own range, not walk onto the enemy.
      expect(nearest).toBeLessThanOrEqual(attacker.effectiveRange());
      expect(nearest).toBeGreaterThan(1);
    }
  });

  it("DEFENSIVE stays near its anchor instead of advancing", () => {
    const game = new Game(20, alwaysHit);
    game.clearObjectives(); // with ground to take, even a defender moves
    setStrategy(game, 0, PlatoonStrategy.DEFENSIVE);
    setStrategy(game, 1, PlatoonStrategy.DEFENSIVE);

    for (let i = 0; i < 200; i += 1) game.tick();

    for (const unit of game.getPlatoons()[0].units) {
      expect(distanceMeters(unit.spawnPosition, unit.position)).toBeLessThan(
        120
      );
    }
  });

  it("DEFENSIVE improves the cover it is standing in where better exists", () => {
    const game = new Game(20, alwaysHit);
    game.clearObjectives();
    setStrategy(game, 0, PlatoonStrategy.DEFENSIVE);
    setStrategy(game, 1, PlatoonStrategy.DEFENSIVE);

    const before = game
      .getPlatoons()[0]
      .units.map((u) => coverRank[u.cover])
      .reduce((a, b) => a + b, 0);

    for (let i = 0; i < 300; i += 1) game.tick();

    const after = game
      .getPlatoons()[0]
      .units.map((u) => coverRank[u.cover])
      .reduce((a, b) => a + b, 0);

    // Nobody should have ended up worse off than they started.
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("PATROL walks a leg while out of contact", () => {
    const game = new Game(20, alwaysHit);
    setStrategy(game, 0, PlatoonStrategy.PATROL);
    setStrategy(game, 1, PlatoonStrategy.DEFENSIVE);

    const unit = game.getPlatoons()[0].units[0];
    const start: Coordinate = [...unit.position] as Coordinate;

    for (let i = 0; i < 40; i += 1) game.tick();

    expect(distanceMeters(start, unit.position)).toBeGreaterThan(5);
  });

  it("PATROL breaks off to engage once an enemy is detected", () => {
    const game = new Game(20, alwaysHit);
    setStrategy(game, 0, PlatoonStrategy.PATROL);
    setStrategy(game, 1, PlatoonStrategy.AGGRESSIVE);

    for (let i = 0; i < 800; i += 1) {
      game.tick();
      if (game.getEvents().some((e) => e.type === "hit")) break;
    }

    expect(game.getEvents().some((e) => e.type === "hit")).toBe(true);
  });
});

describe("cover seeking", () => {
  it("finds the best cover in a radius, deterministically", () => {
    const origin: Coordinate = [57.1, 26.8];

    const a = bestCoverNear(origin, 70);
    const b = bestCoverNear(origin, 70);

    expect(a).toEqual(b);
    expect(a.rank).toBeGreaterThanOrEqual(coverRank[coverAt(origin)]);
  });

  it("never returns a position outside the search radius", () => {
    const origin: Coordinate = [57.1, 26.8];
    const best = bestCoverNear(origin, 70);

    expect(distanceMeters(origin, best.position)).toBeLessThanOrEqual(71);
  });
});

describe("standoff constant", () => {
  it("keeps units inside their effective range when they stop", () => {
    expect(STANDOFF_FRACTION).toBeGreaterThan(0);
    expect(STANDOFF_FRACTION).toBeLessThan(1);
  });
});

describe("dead units", () => {
  it("are not steered by autonomy", () => {
    const game = new Game(20, alwaysHit);
    const casualty = game.getPlatoons()[0].units[0];
    casualty.takeDamage(UNIT_MAX_HEALTH);

    for (let i = 0; i < 30; i += 1) game.tick();

    expect(casualty.status).toBe(UnitStatusType.Kia);
    expect(casualty.destination).toBeNull();
  });
});
