import { describe, it, expect } from "vitest";
import { Game } from "../game/Game";
import { Unit, UNIT_MAX_HEALTH, healthStatusFor } from "../game/Unit";
import { initialPlatoons } from "../config/gameConfig";
import {
  GameStatus,
  Role,
  UnitStatusType,
  PlatoonFaction,
  AmmunitionType,
} from "shared";

describe("Unit construction isolation", () => {
  // Regression: the constructor used to assign defaultInventory[role] by reference
  // and shallow-copy defaultBodyParts, so every unit shared one inventory per role
  // and one set of body-part objects across the entire game.
  it("gives each unit its own inventory object", () => {
    const a = new Unit("a", [0, 0], Role.Rifleman);
    const b = new Unit("b", [1, 1], Role.Rifleman);

    expect(a.inventory).not.toBe(b.inventory);
    expect(a.inventory.ammunition).not.toBe(b.inventory.ammunition);

    const before = b.inventory.ammunition[AmmunitionType.RifleAmmo];
    a.inventory.ammunition[AmmunitionType.RifleAmmo] -= 30;

    expect(b.inventory.ammunition[AmmunitionType.RifleAmmo]).toBe(before);
  });

  it("gives each unit its own body-part objects", () => {
    const a = new Unit("a", [0, 0], Role.Rifleman);
    const b = new Unit("b", [1, 1], Role.SquadLeader);

    expect(a.bodyParts[0]).not.toBe(b.bodyParts[0]);

    a.bodyParts[0].hitPoints -= 10;
    expect(b.bodyParts[0].hitPoints).toBe(35);
  });

  it("keeps every unit across both starting platoons independent", () => {
    const platoons = initialPlatoons();
    const units = platoons.flatMap((p) => p.units);

    const inventories = new Set(units.map((u) => u.inventory));
    const heads = new Set(units.map((u) => u.bodyParts[0]));

    expect(inventories.size).toBe(units.length);
    expect(heads.size).toBe(units.length);
  });
});

describe("Unit damage", () => {
  it("tracks healthStatus as damage accumulates", () => {
    const u = new Unit("u", [0, 0], Role.Rifleman);
    expect(u.healthStatus).toBe("healthy");

    u.takeDamage(10);
    expect(u.healthStatus).toBe("wounded");

    u.takeDamage(UNIT_MAX_HEALTH * 0.8);
    expect(u.healthStatus).toBe("critical");
    expect(u.isAlive()).toBe(true);
  });

  it("marks a unit KIA at zero health and never goes negative", () => {
    const u = new Unit("u", [0, 0], Role.Rifleman);
    u.takeDamage(UNIT_MAX_HEALTH * 2);

    expect(u.health).toBe(0);
    expect(u.status).toBe(UnitStatusType.Kia);
    expect(u.healthStatus).toBe("kia");
    expect(u.isAlive()).toBe(false);
  });

  it("maps health to status at the boundaries", () => {
    expect(healthStatusFor(UNIT_MAX_HEALTH)).toBe("healthy");
    expect(healthStatusFor(UNIT_MAX_HEALTH - 1)).toBe("wounded");
    expect(healthStatusFor(UNIT_MAX_HEALTH * 0.25)).toBe("critical");
    expect(healthStatusFor(0)).toBe("kia");
  });
});

describe("Game lifecycle", () => {
  it("starts, pauses and resets", () => {
    const game = new Game();
    expect(game.getStatus()).toBe(GameStatus.NOT_STARTED);

    game.start();
    expect(game.getStatus()).toBe(GameStatus.RUNNING);
    expect(game.start()).toMatch(/already running/);

    game.pause();
    expect(game.getStatus()).toBe(GameStatus.PAUSED);

    game.reset();
    expect(game.getStatus()).toBe(GameStatus.NOT_STARTED);
  });

  it("restores full health on reset", () => {
    const game = new Game();
    const unit = game.getPlatoons()[0].units[0];
    unit.takeDamage(100);
    expect(unit.health).toBeLessThan(UNIT_MAX_HEALTH);

    game.reset();
    expect(game.getPlatoons()[0].units[0].health).toBe(UNIT_MAX_HEALTH);
  });

  it("seeds two platoons with distinct ids and factions", () => {
    const platoons = new Game().getPlatoons();

    expect(platoons.map((p) => p.id)).toEqual(["usec-1", "bear-1"]);
    expect(platoons.map((p) => p.faction)).toEqual([
      PlatoonFaction.USEC,
      PlatoonFaction.BEAR,
    ]);
    // Regression: id used to equal faction, making a second platoon per faction
    // unaddressable.
    expect(platoons.every((p) => p.id !== p.faction)).toBe(true);
  });
});

describe("Game.attackPlatoon", () => {
  it("actually deals damage instead of reporting a no-op", () => {
    // Deterministic RNG: every shot that is in range connects.
    const game = new Game(1, () => 0);
    const [usec, bear] = game.getPlatoons();

    // The platoons spawn ~1 km apart, beyond every weapon. Close to contact.
    for (const unit of bear.units) {
      unit.move([...usec.units[0].position] as [number, number]);
    }

    const before = bear.units.reduce((sum, u) => sum + u.health, 0);
    game.attackPlatoon("usec-1", "bear-1");
    const after = bear.units.reduce((sum, u) => sum + u.health, 0);

    expect(after).toBeLessThan(before);
  });

  it("lands no shots while the platoons are out of range", () => {
    const game = new Game(1, () => 0);
    const bear = game.getPlatoons()[1];
    const before = bear.units.reduce((sum, u) => sum + u.health, 0);

    const result = game.attackPlatoon("usec-1", "bear-1");

    expect(bear.units.reduce((sum, u) => sum + u.health, 0)).toBe(before);
    expect(result).toMatch(/0 hit/);
  });

  it("reports when a platoon id is unknown", () => {
    const game = new Game();
    expect(game.attackPlatoon("usec-1", "nope")).toMatch(/not found/);
  });
});
