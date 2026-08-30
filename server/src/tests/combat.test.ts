import { describe, it, expect } from "vitest";
import {
  Role,
  UnitStatusType,
  Coordinate,
  CoverType,
  WeaponType,
  SightType,
  weaponEffectiveRange,
  hitChance,
  BASE_HIT_CHANCE,
  MAX_RANGE_HIT_CHANCE,
} from "shared";
import { Game } from "../game/Game";
import { Unit, UNIT_MAX_HEALTH } from "../game/Unit";

/** Always hits. */
const alwaysHit = () => 0;
/** Never hits — 1 is never below any probability. */
const alwaysMiss = () => 1;

const at = (meters: number): Coordinate => [57.1 + meters / 111_320, 26.8];

describe("hitChance", () => {
  it("is highest at point blank and lowest at the edge of range", () => {
    expect(hitChance(0, 300)).toBeCloseTo(BASE_HIT_CHANCE, 5);
    expect(hitChance(300, 300)).toBeCloseTo(MAX_RANGE_HIT_CHANCE, 5);
  });

  it("falls off monotonically with distance", () => {
    const samples = [0, 50, 100, 200, 300].map((m) => hitChance(m, 300));

    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]).toBeLessThan(samples[i - 1]);
    }
  });

  it("is zero beyond effective range", () => {
    expect(hitChance(301, 300)).toBe(0);
    expect(hitChance(10_000, 300)).toBe(0);
  });
});

describe("Unit weapon profile", () => {
  it("reads effective range from the weapon and sight tables", () => {
    const recon = new Unit("r", [57.1, 26.8], Role.Recon);

    expect(recon.effectiveRange()).toBe(
      weaponEffectiveRange[WeaponType.SniperRifle][SightType.Scope]
    );
    expect(recon.effectiveRange()).toBe(800);
  });

  it("gives a sniper more reach and more punch than a rifleman", () => {
    const recon = new Unit("r", [57.1, 26.8], Role.Recon);
    const rifleman = new Unit("f", [57.1, 26.8], Role.Rifleman);

    expect(recon.effectiveRange()).toBeGreaterThan(rifleman.effectiveRange());
    expect(recon.damagePerShot()).toBeGreaterThan(rifleman.damagePerShot());
  });

  it("gives the machine gunner a faster cycle than the sniper", () => {
    const gunner = new Unit("g", [57.1, 26.8], Role.LightMachineGunner);
    const recon = new Unit("r", [57.1, 26.8], Role.Recon);

    expect(gunner.secondsBetweenShots()).toBeLessThan(
      recon.secondsBetweenShots()
    );
  });
});

describe("Unit.fireAt", () => {
  it("damages the target on a hit", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(50), Role.Rifleman);
    target.cover = CoverType.None;

    const shot = shooter.fireAt(target, alwaysHit);

    expect(shot.hit).toBe(true);
    expect(shot.damage).toBe(shooter.damagePerShot());
    expect(target.health).toBe(UNIT_MAX_HEALTH - shot.damage);
  });

  it("leaves the target untouched on a miss", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(50), Role.Rifleman);

    const shot = shooter.fireAt(target, alwaysMiss);

    expect(shot.hit).toBe(false);
    expect(target.health).toBe(UNIT_MAX_HEALTH);
  });

  it("cannot hit past effective range even with a perfect roll", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(shooter.effectiveRange() + 1), Role.Rifleman);

    expect(shooter.fireAt(target, alwaysHit).hit).toBe(false);
    expect(target.health).toBe(UNIT_MAX_HEALTH);
  });

  it("goes on cooldown after firing and recovers over time", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(50), Role.Rifleman);

    expect(shooter.canFire()).toBe(true);
    shooter.fireAt(target, alwaysHit);
    expect(shooter.canFire()).toBe(false);

    shooter.coolDown(shooter.secondsBetweenShots());
    expect(shooter.canFire()).toBe(true);
  });

  it("reports the kill that ends the target", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(10), Role.Rifleman);
    target.cover = CoverType.None;
    target.takeDamage(UNIT_MAX_HEALTH - 1);

    const shot = shooter.fireAt(target, alwaysHit);

    expect(shot.killed).toBe(true);
    expect(target.status).toBe(UnitStatusType.Kia);
    expect(target.healthStatus).toBe("kia");
  });

  it("stops a dead unit from firing", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    shooter.takeDamage(UNIT_MAX_HEALTH);

    expect(shooter.canFire()).toBe(false);
  });
});

describe("engagement through the tick loop", () => {
  /** Put both platoons on top of each other so everything is in range. */
  const closeToContact = (game: Game) => {
    const [usec, bear] = game.getPlatoons();
    for (const unit of bear.units) {
      unit.move([...usec.units[0].position] as Coordinate);
    }
  };

  it("does not engage while the platoons are out of range", () => {
    const game = new Game(1, alwaysHit);
    const roster = game.getPlatoons().flatMap((p) => p.units).length;

    for (let i = 0; i < 20; i += 1) game.tick();

    const total = game
      .getPlatoons()
      .flatMap((p) => p.units)
      .reduce((sum, u) => sum + u.health, 0);

    expect(total).toBe(UNIT_MAX_HEALTH * roster);
    expect(game.getEvents().some((e) => e.type === "hit")).toBe(false);
  });

  it("opens fire once the platoons are within range", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);

    game.tick();

    expect(game.getEvents().length).toBeGreaterThan(0);
    expect(
      game.getPlatoons()[1].units.some((u) => u.health < UNIT_MAX_HEALTH)
    ).toBe(true);
  });

  it("marks engaged units and assigns them a target", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);

    game.tick();

    const shooter = game.getPlatoons()[0].units[0];
    expect(shooter.targetId).not.toBeNull();
    // At point-blank with fire coming back, a unit in contact is either
    // shooting or being held down — both count as engaged.
    expect([UnitStatusType.Engaged, UnitStatusType.Pinned]).toContain(
      shooter.status
    );
  });

  it("never targets a unit of its own faction", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);
    game.tick();

    const [usec, bear] = game.getPlatoons();
    const bearIds = new Set(bear.units.map((u) => u.id));

    for (const unit of usec.units) {
      if (unit.targetId) expect(bearIds.has(unit.targetId)).toBe(true);
    }
  });

  it("fights to a conclusion, leaving one side eliminated", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);

    for (let i = 0; i < 400 && !game.getPlatoons().some((p) => p.isEliminated()); i += 1) {
      game.tick();
    }

    const eliminated = game.getPlatoons().filter((p) => p.isEliminated());
    expect(eliminated).toHaveLength(1);

    // Every dead unit is properly settled, not left mid-order.
    for (const unit of eliminated[0].units) {
      expect(unit.status).toBe(UnitStatusType.Kia);
      expect(unit.health).toBe(0);
      expect(unit.destination).toBeNull();
      expect(unit.targetId).toBeNull();
    }
  });

  it("stops a KIA unit from firing or being fired at", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);

    const bear = game.getPlatoons()[1];
    const casualty = bear.units[0];
    casualty.takeDamage(UNIT_MAX_HEALTH);

    for (let i = 0; i < 5; i += 1) game.tick();

    expect(casualty.targetId).toBeNull();
    for (const unit of game.getPlatoons()[0].units) {
      expect(unit.targetId).not.toBe(casualty.id);
    }
  });

  it("logs hits and kills, and caps the event log", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);

    for (let i = 0; i < 200; i += 1) game.tick();

    const events = game.getEvents();
    expect(events.length).toBeLessThanOrEqual(60);
    expect(events.some((e) => e.type === "kia")).toBe(true);
    expect(events.every((e) => typeof e.tick === "number")).toBe(true);
  });

  it("clears the event log on reset", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);
    game.tick();
    expect(game.getEvents().length).toBeGreaterThan(0);

    game.reset();

    expect(game.getEvents()).toHaveLength(0);
    expect(game.getGameState().events).toHaveLength(0);
  });

  it("is deterministic given the same RNG", () => {
    const run = () => {
      let seed = 1;
      const rng = () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };
      const game = new Game(1, rng);
      closeToContact(game);
      for (let i = 0; i < 60; i += 1) game.tick();
      return game
        .getPlatoons()
        .flatMap((p) => p.units.map((u) => u.health));
    };

    expect(run()).toEqual(run());
  });
});

describe("starting positions", () => {
  it("puts the platoons within about a kilometre, not tens of them", () => {
    const [usec, bear] = new Game().getPlatoons();
    const meters = usec.units[0].distanceTo(bear.units[0]);

    expect(meters).toBeGreaterThan(500);
    expect(meters).toBeLessThan(1500);
  });

  it("starts everyone outside every weapon's effective range", () => {
    const [usec, bear] = new Game().getPlatoons();

    for (const attacker of usec.units) {
      for (const target of bear.units) {
        expect(attacker.distanceTo(target)).toBeGreaterThan(
          attacker.effectiveRange()
        );
      }
    }
  });

  it("spaces each platoon out rather than stacking it on one point", () => {
    const usec = new Game().getPlatoons()[0];

    for (let i = 1; i < usec.units.length; i += 1) {
      const gap = usec.units[i - 1].distanceTo(usec.units[i]);
      expect(gap).toBeGreaterThan(20);
      expect(gap).toBeLessThan(80);
    }
  });
});
