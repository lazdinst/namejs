import { describe, it, expect } from "vitest";
import {
  Role,
  Coordinate,
  CoverType,
  TerrainType,
  AmmunitionType,
  WeaponType,
  weaponMagazineSize,
  weaponReloadSeconds,
  coverDamageMultiplier,
  terrainSpeedMultiplier,
  terrainAt,
  coverAt,
  speedMultiplierAt,
  terrainCell,
  defaultInventory,
} from "shared";
import { Game } from "../game/Game";
import { Unit, UNIT_MAX_HEALTH } from "../game/Unit";

const alwaysHit = () => 0;
const at = (meters: number): Coordinate => [57.1 + meters / 111_320, 26.8];

/** Drain a unit's magazine by firing at a target that cannot die. */
const emptyMagazine = (shooter: Unit, target: Unit) => {
  while (shooter.magazine > 0) {
    shooter.fireAt(target, alwaysHit);
    target.health = UNIT_MAX_HEALTH;
    target.healthStatus = "healthy";
    shooter.fireCooldown = 0;
  }
};

const stripAllAmmo = (game: Game) => {
  for (const platoon of game.getPlatoons()) {
    for (const unit of platoon.units) {
      unit.magazine = 0;
      for (const key of Object.keys(unit.inventory.ammunition)) {
        unit.inventory.ammunition[key as AmmunitionType] = 0;
      }
    }
  }
};

const closeToContact = (game: Game) => {
  const [usec, bear] = game.getPlatoons();
  for (const unit of bear.units) {
    unit.move([...usec.units[0].position] as Coordinate);
  }
};

// ------------------------------------------------------------------ terrain

describe("terrain", () => {
  it("is deterministic — the same point always yields the same ground", () => {
    const point: Coordinate = [57.1234, 26.8765];

    expect(terrainAt(point)).toBe(terrainAt(point));
    expect(coverAt(point)).toBe(coverAt(point));
  });

  it("forms patches rather than changing at every point", () => {
    const a: Coordinate = [57.1, 26.8];
    const b: Coordinate = [57.10005, 26.8]; // ~5 m away, same cell

    expect(terrainCell(a)).toEqual(terrainCell(b));
    expect(terrainAt(a)).toBe(terrainAt(b));
  });

  it("does vary across the map rather than returning one constant", () => {
    const seen = new Set<TerrainType>();
    for (let i = 0; i < 400; i += 1) {
      seen.add(terrainAt([57.1 + i * 0.002, 26.8 + i * 0.003]));
    }

    expect(seen.size).toBeGreaterThan(2);
  });

  it("gives every terrain type a usable speed multiplier", () => {
    for (const terrain of Object.values(TerrainType)) {
      expect(terrainSpeedMultiplier[terrain]).toBeGreaterThan(0);
      expect(terrainSpeedMultiplier[terrain]).toBeLessThanOrEqual(1);
    }
  });

  it("slows movement over bad ground", () => {
    expect(terrainSpeedMultiplier[TerrainType.Mud]).toBeLessThan(
      terrainSpeedMultiplier[TerrainType.Clear]
    );
    expect(terrainSpeedMultiplier[TerrainType.Water]).toBeLessThan(
      terrainSpeedMultiplier[TerrainType.Snow]
    );
  });

  it("applies the ground multiplier to a unit's step", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    const start: Coordinate = [...unit.position] as Coordinate;
    unit.setDestination([57.5, 26.8]);

    const covered = unit.advance(10);
    const expected = unit.speedMetersPerSecond * speedMultiplierAt(start) * 10;

    expect(covered).toBeCloseTo(expected, 6);
  });

  it("updates a unit's cover as it moves onto new ground", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    unit.setDestination([57.5, 26.8]);

    const seen = new Set<CoverType>([unit.cover]);
    for (let i = 0; i < 300; i += 1) {
      unit.advance(20);
      seen.add(unit.cover);
    }

    expect(seen.size).toBeGreaterThan(1);
  });
});

// -------------------------------------------------------------------- cover

describe("cover", () => {
  it("reduces damage in proportion to how good it is", () => {
    const order = [
      CoverType.None,
      CoverType.Low,
      CoverType.Medium,
      CoverType.High,
    ];

    for (let i = 1; i < order.length; i += 1) {
      expect(coverDamageMultiplier[order[i]]).toBeLessThan(
        coverDamageMultiplier[order[i - 1]]
      );
    }
    expect(coverDamageMultiplier[CoverType.None]).toBe(1);
  });

  it("lets a unit in high cover take less than a unit in the open", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);

    const exposed = new Unit("b", at(50), Role.Rifleman);
    exposed.cover = CoverType.None;
    const dug = new Unit("c", at(50), Role.Rifleman);
    dug.cover = CoverType.High;

    const openShot = shooter.fireAt(exposed, alwaysHit);
    shooter.fireCooldown = 0;
    const coveredShot = shooter.fireAt(dug, alwaysHit);

    expect(coveredShot.damage).toBeLessThan(openShot.damage);
    expect(dug.health).toBeGreaterThan(exposed.health);
  });

  it("reports how much the cover stopped", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(50), Role.Rifleman);
    target.cover = CoverType.Medium;

    const shot = shooter.fireAt(target, alwaysHit);

    expect(shot.cover).toBe(CoverType.Medium);
    expect(shot.absorbed).toBeCloseTo(shooter.damagePerShot() * 0.5, 6);
    expect(shot.damage + shot.absorbed).toBeCloseTo(shooter.damagePerShot(), 6);
  });

  it("absorbs nothing in the open", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(50), Role.Rifleman);
    target.cover = CoverType.None;

    expect(shooter.fireAt(target, alwaysHit).absorbed).toBe(0);
  });

  it("makes a unit in cover take more rounds to kill", () => {
    const shotsToKill = (cover: CoverType) => {
      const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
      const target = new Unit("b", at(20), Role.Rifleman);
      target.cover = cover;

      let shots = 0;
      while (target.isAlive() && shots < 1000) {
        shooter.fireCooldown = 0;
        shooter.magazine = 30;
        shooter.fireAt(target, alwaysHit);
        shots += 1;
      }
      return shots;
    };

    expect(shotsToKill(CoverType.High)).toBeGreaterThan(
      shotsToKill(CoverType.None)
    );
  });
});

// --------------------------------------------------------------- ammunition

describe("ammunition", () => {
  it("gives every role a loaded weapon and a reserve", () => {
    for (const role of Object.values(Role)) {
      const unit = new Unit("u", [57.1, 26.8], role);

      expect(unit.magazine).toBeGreaterThan(0);
      expect(
        unit.inventory.ammunition[unit.ammoTypeInHand()] + unit.magazine
      ).toBeGreaterThan(0);
    }
  });

  it("loads a full magazine at spawn, drawn from the reserve", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    const capacity = weaponMagazineSize[WeaponType.AssaultRifle];
    const carried =
      defaultInventory[Role.Rifleman].ammunition[AmmunitionType.RifleAmmo];

    expect(unit.magazine).toBe(capacity);
    expect(unit.inventory.ammunition[AmmunitionType.RifleAmmo]).toBe(
      carried - capacity
    );
  });

  it("spends a round per shot", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(50), Role.Rifleman);
    const before = shooter.magazine;

    shooter.fireAt(target, alwaysHit);

    expect(shooter.magazine).toBe(before - 1);
  });

  it("cannot fire on an empty magazine", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(50), Role.Rifleman);

    emptyMagazine(shooter, target);

    expect(shooter.magazine).toBe(0);
    expect(shooter.canFire()).toBe(false);
  });

  it("reloads after a delay and comes back up with a full magazine", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(50), Role.Rifleman);
    emptyMagazine(shooter, target);

    // First service starts the reload; the unit is down until it finishes.
    shooter.serviceWeapon(0.1);
    expect(shooter.isReloading()).toBe(true);
    expect(shooter.canFire()).toBe(false);

    shooter.serviceWeapon(weaponReloadSeconds[WeaponType.AssaultRifle]);

    expect(shooter.isReloading()).toBe(false);
    expect(shooter.magazine).toBe(weaponMagazineSize[WeaponType.AssaultRifle]);
    expect(shooter.canFire()).toBe(true);
  });

  it("draws only what is left when the reserve is nearly gone", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(50), Role.Rifleman);

    shooter.inventory.ammunition[AmmunitionType.RifleAmmo] = 7;
    emptyMagazine(shooter, target);
    shooter.serviceWeapon(0.1);
    shooter.serviceWeapon(weaponReloadSeconds[WeaponType.AssaultRifle]);

    expect(shooter.magazine).toBe(7);
    expect(shooter.inventory.ammunition[AmmunitionType.RifleAmmo]).toBe(0);
  });

  it("falls back to the sidearm when the primary reserve is spent", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(30), Role.Rifleman);

    shooter.inventory.ammunition[AmmunitionType.RifleAmmo] = 0;
    emptyMagazine(shooter, target);
    shooter.serviceWeapon(0.1);

    expect(shooter.activeWeapon).toBe("secondary");
    expect(shooter.weaponInHand()).toBe(WeaponType.Pistol);

    shooter.serviceWeapon(weaponReloadSeconds[WeaponType.Pistol]);

    expect(shooter.magazine).toBeGreaterThan(0);
    // The sidearm is a real downgrade in both reach and stopping power.
    expect(shooter.damagePerShot()).toBe(15);
    expect(shooter.effectiveRange()).toBe(40);
  });

  it("is out of ammunition only when both weapons are dry", () => {
    const shooter = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const target = new Unit("b", at(30), Role.Rifleman);

    shooter.inventory.ammunition[AmmunitionType.RifleAmmo] = 0;
    emptyMagazine(shooter, target);
    expect(shooter.isOutOfAmmo()).toBe(false); // pistol rounds remain

    shooter.inventory.ammunition[AmmunitionType.PistolAmmo] = 0;
    expect(shooter.isOutOfAmmo()).toBe(true);
    expect(shooter.canFire()).toBe(false);
  });

  it("gives the machine gunner the deepest magazine", () => {
    const gunner = new Unit("g", [57.1, 26.8], Role.LightMachineGunner);
    const rifleman = new Unit("r", [57.1, 26.8], Role.Rifleman);

    expect(gunner.magazine).toBeGreaterThan(rifleman.magazine);
  });

  it("keeps each unit's reserve independent", () => {
    const a = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const b = new Unit("b", [57.1, 26.8], Role.Rifleman);

    a.inventory.ammunition[AmmunitionType.RifleAmmo] = 0;

    expect(b.inventory.ammunition[AmmunitionType.RifleAmmo]).toBeGreaterThan(0);
  });
});

// ------------------------------------------------ ammunition through the loop

describe("ammunition through the tick loop", () => {
  it("draws down magazines as the fight runs", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);
    const shooter = game.getPlatoons()[0].units[0];
    const before = shooter.magazine;

    for (let i = 0; i < 12; i += 1) game.tick();

    expect(shooter.magazine).toBeLessThan(before);
  });

  it("reports a spent unit once, not every tick", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);
    stripAllAmmo(game);

    for (let i = 0; i < 30; i += 1) game.tick();

    const dry = game.getEvents().filter((e) => e.type === "dry");
    const messages = dry.map((e) => e.message);

    expect(dry.length).toBeGreaterThan(0);
    expect(new Set(messages).size).toBe(messages.length);
  });

  it("stops dealing damage once everyone is dry", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);
    stripAllAmmo(game);

    const total = () =>
      game
        .getPlatoons()
        .flatMap((p) => p.units)
        .reduce((sum, u) => sum + u.health, 0);

    const before = total();
    for (let i = 0; i < 40; i += 1) game.tick();

    expect(total()).toBe(before);
  });

  it("clears the spent-unit report on reset", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);
    for (let i = 0; i < 5; i += 1) game.tick();

    game.reset();

    expect(game.getEvents()).toHaveLength(0);
  });
});
