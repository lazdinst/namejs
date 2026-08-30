import { describe, it, expect } from "vitest";
import {
  PlatoonStrategy,
  strategyInfo,
  strategySpeed,
  strategyStandoff,
  strategyExposure,
  distanceMeters,
  Coordinate,
  Role,
} from "shared";
import { Game } from "../game/Game";
import { Unit, UNIT_MAX_HEALTH } from "../game/Unit";

const alwaysHit = () => 0;

describe("strategy metadata", () => {
  it("documents every posture with real pros and cons", () => {
    for (const strategy of Object.values(PlatoonStrategy)) {
      const info = strategyInfo[strategy];
      expect(info.label.length).toBeGreaterThan(0);
      expect(info.pros.length).toBeGreaterThanOrEqual(2);
      expect(info.cons.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("backs the words with mechanics that differ", () => {
    // Aggressive is the fastest and the most exposed; cautious the opposite.
    expect(strategySpeed[PlatoonStrategy.AGGRESSIVE]).toBeGreaterThan(
      strategySpeed[PlatoonStrategy.CAUTIOUS]
    );
    expect(strategyExposure[PlatoonStrategy.CAUTIOUS]).toBeLessThan(
      strategyExposure[PlatoonStrategy.AGGRESSIVE]
    );
    expect(strategyStandoff[PlatoonStrategy.CAUTIOUS]).toBeGreaterThan(
      strategyStandoff[PlatoonStrategy.AGGRESSIVE]
    );
  });
});

describe("posture mechanics", () => {
  it("stamps every man with his element's posture each tick", () => {
    const game = new Game(20, alwaysHit);
    game.getPlatoons()[0].strategy = PlatoonStrategy.CAUTIOUS;
    game.tick();

    for (const unit of game.getPlatoons()[0].units) {
      expect(unit.postureSpeed).toBe(strategySpeed[PlatoonStrategy.CAUTIOUS]);
      expect(unit.postureExposure).toBe(strategyExposure[PlatoonStrategy.CAUTIOUS]);
    }
  });

  it("moves a cautious element slower than an aggressive one", () => {
    const run = (strategy: PlatoonStrategy) => {
      const game = new Game(20, alwaysHit);
      game.clearObjectives();
      game.getPlatoons()[0].strategy = strategy;
      const unit = game.getPlatoons()[0].units[1];
      const start: Coordinate = [...unit.position] as Coordinate;
      game.tick(); // stamp posture
      unit.setDestination([start[0] + 0.02, start[1]]);
      for (let i = 0; i < 20; i += 1) game.tick();
      return distanceMeters(start, unit.position);
    };

    expect(run(PlatoonStrategy.CAUTIOUS)).toBeLessThan(run(PlatoonStrategy.AGGRESSIVE));
  });

  it("makes a cautious target harder to hit", () => {
    const shooter = new Unit("s", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("t", [57.1008, 26.8], Role.Rifleman);

    const hits = (exposure: number) => {
      target.postureExposure = exposure;
      let n = 0;
      const rng = (() => { let x = 7; return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; })();
      for (let i = 0; i < 400; i += 1) {
        shooter.fireCooldown = 0; shooter.magazine = 30;
        target.health = UNIT_MAX_HEALTH; target.healthStatus = "healthy";
        if (shooter.fireAt(target, rng).hit) n += 1;
      }
      return n;
    };

    expect(hits(strategyExposure[PlatoonStrategy.CAUTIOUS])).toBeLessThan(
      hits(strategyExposure[PlatoonStrategy.AGGRESSIVE])
    );
  });

  it("holds a cautious element further out than an aggressive one", () => {
    const closest = (strategy: PlatoonStrategy) => {
      const game = new Game(20, alwaysHit);
      game.clearObjectives();
      game.getPlatoons()[1].strategy = strategy;
      game.getPlatoons()[0].strategy = PlatoonStrategy.DEFENSIVE;
      for (let i = 0; i < 250; i += 1) game.tick();
      const attackers = game.getPlatoons()[1].units.filter((u) => u.isAlive());
      const defenders = game.getPlatoons()[0].units.filter((u) => u.isAlive());
      if (!attackers.length || !defenders.length) return NaN;
      return Math.min(
        ...attackers.flatMap((a) => defenders.map((d) => a.distanceTo(d)))
      );
    };

    const cautious = closest(PlatoonStrategy.CAUTIOUS);
    const aggressive = closest(PlatoonStrategy.AGGRESSIVE);
    if (Number.isFinite(cautious) && Number.isFinite(aggressive)) {
      expect(cautious).toBeGreaterThan(aggressive);
    }
  });
});

describe("element orders", () => {
  it("sends every effective man to a spread around the point", () => {
    const game = new Game(20, alwaysHit);
    const platoon = game.getPlatoons()[0];
    const target: Coordinate = [57.12, 26.81];

    const result = game.movePlatoon(platoon.id, target);
    expect(result.ok).toBe(true);

    for (const unit of platoon.units) {
      expect(unit.hasOrders).toBe(true);
      expect(unit.destination).not.toBeNull();
      expect(distanceMeters(unit.destination!, target)).toBeLessThan(20);
    }

    // Spread, not stacked: destinations are not all identical.
    const keys = new Set(platoon.units.map((u) => u.destination!.join(",")));
    expect(keys.size).toBeGreaterThan(1);
  });

  it("refuses an unknown element and an empty one", () => {
    const game = new Game(20, alwaysHit);
    expect(game.movePlatoon("ghost-1", [57.1, 26.8]).ok).toBe(false);

    const platoon = game.getPlatoons()[0];
    for (const u of platoon.units) u.takeDamage(UNIT_MAX_HEALTH);
    expect(game.movePlatoon(platoon.id, [57.1, 26.8]).ok).toBe(false);
  });

  it("changes posture through the validated path", () => {
    const game = new Game(20, alwaysHit);
    const platoon = game.getPlatoons()[0];

    expect(game.setPlatoonStrategy(platoon.id, PlatoonStrategy.CAUTIOUS).ok).toBe(true);
    expect(platoon.strategy).toBe(PlatoonStrategy.CAUTIOUS);
    expect(game.setPlatoonStrategy("ghost-1", PlatoonStrategy.PATROL).ok).toBe(false);
  });
});
