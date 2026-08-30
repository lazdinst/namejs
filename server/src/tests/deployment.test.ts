import { describe, it, expect } from "vitest";
import {
  Mos,
  PlatoonFaction,
  PlatoonStrategy,
  WeaponType,
  AmmunitionType,
  ElementBuild,
  ElementSlot,
  generateRoster,
  rollAttributes,
  overallRating,
  defaultLoadout,
  loadoutWeightKg,
  validateLoadout,
  validateElement,
  encumbranceSpeed,
  mosDefinitions,
  marksmanshipMultiplier,
  composureResistance,
  distanceMeters,
  HELICOPTER_SPEED_MPS,
  ELEMENT_MIN_SIZE,
  allMos,
  Role,
} from "shared";
import { Game } from "../game/Game";
import { Unit } from "../game/Unit";

const seeded = (n: number) => () => {
  n = (n * 1103515245 + 12345) % 2147483648;
  return n / 2147483648;
};

const pick = (roster: ReturnType<typeof generateRoster>, mos: Mos, nth = 0) =>
  roster.filter((s) => s.mos === mos)[nth];

const slot = (
  roster: ReturnType<typeof generateRoster>,
  mos: Mos,
  nth = 0
): ElementSlot => {
  const soldier = pick(roster, mos, nth);
  return { soldier, loadout: defaultLoadout(mos) };
};

/** A legal six-man element: a leader, a medic, and four shooters. */
const legalBuild = (
  roster: ReturnType<typeof generateRoster>,
  overrides: Partial<ElementBuild> = {}
): ElementBuild => ({
  name: "ODA 0321",
  faction: PlatoonFaction.USEC,
  strategy: PlatoonStrategy.AGGRESSIVE,
  landingZoneId: "LZ-1",
  slots: [
    slot(roster, Mos.A18),
    slot(roster, Mos.B18),
    slot(roster, Mos.C18),
    slot(roster, Mos.D18),
    slot(roster, Mos.E18),
    slot(roster, Mos.F18),
  ],
  ...overrides,
});

// ------------------------------------------------------------------- MOS

describe("MOS definitions", () => {
  it("defines every 18-series MOS with a role and a weapon", () => {
    for (const mos of allMos) {
      const def = mosDefinitions[mos];
      expect(def.title.length).toBeGreaterThan(0);
      expect(def.allowedPrimaries).toContain(def.primaryWeapon);
      expect(def.loadCapacityKg).toBeGreaterThan(20);
    }
  });

  it("gives the medic the best medicine and the marksman the best aim", () => {
    const best = (key: "medicine" | "marksmanship") =>
      allMos.reduce((top, mos) =>
        mosDefinitions[mos].baseline[key] > mosDefinitions[top].baseline[key] ? mos : top
      );

    expect(best("medicine")).toBe(Mos.D18);
    expect(best("marksmanship")).toBe(Mos.F18);
  });
});

describe("attributes", () => {
  it("roll around the MOS baseline, never outside 1–10", () => {
    const random = seeded(3);
    for (let i = 0; i < 200; i += 1) {
      const a = rollAttributes(Mos.B18, random);
      for (const v of Object.values(a)) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(10);
      }
      expect(Math.abs(a.marksmanship - mosDefinitions[Mos.B18].baseline.marksmanship)).toBeLessThanOrEqual(2);
    }
  });

  it("feed the simulation in the right direction", () => {
    const sharp = { ...mosDefinitions[Mos.A18].baseline, marksmanship: 10 };
    const dull = { ...mosDefinitions[Mos.A18].baseline, marksmanship: 1 };
    expect(marksmanshipMultiplier(sharp)).toBeGreaterThan(marksmanshipMultiplier(dull));

    const calm = { ...sharp, composure: 10 };
    const jumpy = { ...sharp, composure: 1 };
    expect(composureResistance(calm)).toBeLessThan(composureResistance(jumpy));
  });

  it("collapse to one rating for the draft board", () => {
    expect(overallRating({ marksmanship: 5, composure: 5, fitness: 5, awareness: 5, medicine: 5, leadership: 5 })).toBe(5);
    expect(overallRating({ marksmanship: 10, composure: 10, fitness: 10, awareness: 10, medicine: 10, leadership: 10 })).toBe(10);
  });
});

describe("draft board", () => {
  it("offers several candidates per MOS", () => {
    const roster = generateRoster(seeded(1), 3);
    for (const mos of allMos) {
      expect(roster.filter((s) => s.mos === mos)).toHaveLength(3);
    }
  });

  it("is reproducible from a seed", () => {
    expect(generateRoster(seeded(9))).toEqual(generateRoster(seeded(9)));
  });

  it("gives every soldier a unique id", () => {
    const roster = generateRoster(seeded(1));
    expect(new Set(roster.map((s) => s.id)).size).toBe(roster.length);
  });
});

// --------------------------------------------------------------- loadout

describe("loadout", () => {
  it("issues a legal default for every MOS", () => {
    for (const mos of allMos) {
      expect(validateLoadout(mos, defaultLoadout(mos))).toEqual([]);
    }
  });

  it("weighs more the more you pack", () => {
    const light = defaultLoadout(Mos.B18);
    const heavy = { ...light, fragGrenades: 6, primaryMagazines: 10 };
    expect(loadoutWeightKg(Mos.B18, heavy)).toBeGreaterThan(loadoutWeightKg(Mos.B18, light));
  });

  it("refuses more than the MOS can carry", () => {
    const overloaded = { ...defaultLoadout(Mos.F18), primaryMagazines: 12, fragGrenades: 6, smokeGrenades: 6 };
    const problems = validateLoadout(Mos.F18, overloaded);
    expect(problems.some((p) => p.field === "weight")).toBe(true);
  });

  it("refuses a weapon the MOS does not carry", () => {
    const wrong = { ...defaultLoadout(Mos.D18), primaryWeapon: WeaponType.LightMachineGun };
    expect(validateLoadout(Mos.D18, wrong).some((p) => p.field === "primaryWeapon")).toBe(true);
  });

  it("caps each pouch", () => {
    const stuffed = { ...defaultLoadout(Mos.C18), fragGrenades: 99 };
    expect(validateLoadout(Mos.C18, stuffed).some((p) => p.field === "fragGrenades")).toBe(true);
  });

  it("slows a heavily loaded man on the approach", () => {
    // Stripped down to the bare kit — comfortably under the knee.
    const light = { ...defaultLoadout(Mos.C18), primaryMagazines: 1, fragGrenades: 0, smokeGrenades: 0 };
    const heavy = { ...light, primaryMagazines: 11, fragGrenades: 6, smokeGrenades: 5 };
    expect(encumbranceSpeed(Mos.C18, light)).toBe(1);
    expect(encumbranceSpeed(Mos.C18, heavy)).toBeLessThan(1);
  });
});

// --------------------------------------------------------------- element

describe("element rules", () => {
  const roster = generateRoster(seeded(2));

  it("accepts a well-formed team", () => {
    expect(validateElement(legalBuild(roster))).toEqual([]);
  });

  it("needs someone to lead it", () => {
    const build = legalBuild(roster, {
      slots: [slot(roster, Mos.B18), slot(roster, Mos.C18), slot(roster, Mos.D18), slot(roster, Mos.E18)],
    });
    expect(validateElement(build).some((p) => p.message.includes("lead"))).toBe(true);
  });

  it("needs a medic", () => {
    const build = legalBuild(roster, {
      slots: [slot(roster, Mos.A18), slot(roster, Mos.B18), slot(roster, Mos.C18), slot(roster, Mos.E18)],
    });
    expect(validateElement(build).some((p) => p.message.includes("medic"))).toBe(true);
  });

  it("refuses the same man twice", () => {
    const build = legalBuild(roster);
    build.slots[5] = build.slots[1];
    expect(validateElement(build).some((p) => p.message.includes("already"))).toBe(true);
  });

  it("enforces the size band", () => {
    const tiny = legalBuild(roster, { slots: [slot(roster, Mos.A18), slot(roster, Mos.D18)] });
    expect(validateElement(tiny).some((p) => p.message.includes(`${ELEMENT_MIN_SIZE}`))).toBe(true);
  });

  it("surfaces a bad loadout against the man carrying it", () => {
    const build = legalBuild(roster);
    build.slots[1] = { ...build.slots[1], loadout: { ...build.slots[1].loadout, fragGrenades: 50 } };
    const problems = validateElement(build);
    expect(problems.some((p) => p.slot === 1)).toBe(true);
  });
});

// ------------------------------------------------------- unit from soldier

describe("a unit built from a soldier", () => {
  const roster = generateRoster(seeded(4));

  it("carries what the player packed, not the role default", () => {
    const card = pick(roster, Mos.B18);
    const loadout = { ...defaultLoadout(Mos.B18), primaryMagazines: 2 };
    const unit = Unit.fromSoldier("u", [57.1, 26.8], card, loadout);

    // Two spare magazines plus the loaded one, at LMG magazine size.
    expect(unit.magazine).toBe(100);
    expect(unit.inventory.ammunition[AmmunitionType.LMGAmmo]).toBe(200);
    expect(unit.callsign).toBe(card.callsign);
    expect(unit.mos).toBe(Mos.B18);
  });

  it("takes the chosen primary, within what the MOS allows", () => {
    const card = pick(roster, Mos.B18);
    const unit = Unit.fromSoldier("u", [57.1, 26.8], card, {
      ...defaultLoadout(Mos.B18),
      primaryWeapon: WeaponType.SniperRifle,
    });
    expect(unit.primaryWeapon).toBe(WeaponType.SniperRifle);
  });

  it("shoots better with better marksmanship", () => {
    const card = pick(roster, Mos.F18);
    const ace = { ...card, attributes: { ...card.attributes, marksmanship: 10 } };
    const dud = { ...card, attributes: { ...card.attributes, marksmanship: 1 } };

    const a = Unit.fromSoldier("a", [57.1, 26.8], ace, defaultLoadout(Mos.F18));
    const d = Unit.fromSoldier("d", [57.1, 26.8], dud, defaultLoadout(Mos.F18));
    const target = () => new Unit("t", [57.1005, 26.8], Role.Rifleman);

    let aceHits = 0, dudHits = 0;
    const random = seeded(11);
    for (let i = 0; i < 300; i += 1) {
      a.fireCooldown = 0; a.magazine = 10;
      d.fireCooldown = 0; d.magazine = 10;
      const r = random();
      if (a.fireAt(target(), () => r).hit) aceHits += 1;
      if (d.fireAt(target(), () => r).hit) dudHits += 1;
    }
    expect(aceHits).toBeGreaterThan(dudHits);
  });

  it("moves slower when overloaded", () => {
    const card = pick(roster, Mos.C18);
    const light = Unit.fromSoldier("l", [57.1, 26.8], card, defaultLoadout(Mos.C18));
    const heavy = Unit.fromSoldier("h", [57.1, 26.8], card, {
      ...defaultLoadout(Mos.C18), primaryMagazines: 11, fragGrenades: 6, smokeGrenades: 5,
    });
    expect(heavy.speedMetersPerSecond).toBeLessThan(light.speedMetersPerSecond);
  });
});

// ------------------------------------------------------------- dropping in

describe("dropping in", () => {
  it("publishes a draft board and landing zones", () => {
    const game = new Game(20, seeded(5));
    expect(game.getRoster().length).toBeGreaterThan(0);
    expect(game.getLandingZones().length).toBeGreaterThan(0);
  });

  it("rejects an illegal build with the reasons", () => {
    const game = new Game(20, seeded(5));
    const build = legalBuild(game.getRoster(), { slots: [] });
    const result = game.deploy(build);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/at least/);
  });

  it("rejects an unknown landing zone", () => {
    const game = new Game(20, seeded(5));
    const result = game.deploy(legalBuild(game.getRoster(), { landingZoneId: "LZ-99" }));
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/landing zone/i);
  });

  it("puts the element on a helicopter, not on the ground", () => {
    const game = new Game(20, seeded(5));
    const before = game.getPlatoons().length;

    const result = game.deploy(legalBuild(game.getRoster()));

    expect(result.ok).toBe(true);
    expect(game.getFlights()).toHaveLength(1);
    expect(game.getPlatoons()).toHaveLength(before);
    expect(game.getFlights()[0].aboard).toBe(6);
    expect(game.getFlights()[0].status).toBe("inbound");
  });

  it("flies toward the landing zone at helicopter speed", () => {
    const game = new Game(1, seeded(5));
    game.deploy(legalBuild(game.getRoster()));
    const start = game.getFlights()[0].remainingMeters;

    for (let i = 0; i < 10; i += 1) game.tick(); // 1 simulated second

    const flown = start - game.getFlights()[0].remainingMeters;
    expect(flown).toBeCloseTo(HELICOPTER_SPEED_MPS, -1);
  });

  it("lands, and the men are on the ground at the LZ", () => {
    const game = new Game(20, seeded(5));
    const build = legalBuild(game.getRoster());
    const before = game.getPlatoons().length;
    game.deploy(build);

    for (let i = 0; i < 600 && game.getFlights().length > 0; i += 1) game.tick();

    expect(game.getFlights()).toHaveLength(0);
    expect(game.getPlatoons()).toHaveLength(before + 1);

    const landed = game.getPlatoons()[game.getPlatoons().length - 1];
    const lz = game.getLandingZones().find((l) => l.id === build.landingZoneId)!;
    expect(landed.name).toBe("ODA 0321");
    for (const unit of landed.units) {
      expect(distanceMeters(unit.position, lz.position)).toBeLessThan(40);
    }
  });

  it("will not let the same soldier drop twice", () => {
    const game = new Game(20, seeded(5));
    const roster = game.getRoster();
    expect(game.deploy(legalBuild(roster)).ok).toBe(true);

    const again = game.deploy(legalBuild(roster, { name: "ODA 0322", faction: PlatoonFaction.BEAR }));
    expect(again.ok).toBe(false);
    expect(again.message).toMatch(/already been deployed/);
  });

  it("lets a second player build from the remaining candidates", () => {
    const game = new Game(20, seeded(5));
    const roster = game.getRoster();
    game.deploy(legalBuild(roster));

    const second = legalBuild(roster, {
      name: "ODA 0322",
      faction: PlatoonFaction.BEAR,
      landingZoneId: "LZ-4",
      slots: [slot(roster, Mos.Z18, 0), slot(roster, Mos.B18, 1), slot(roster, Mos.C18, 1), slot(roster, Mos.D18, 1)],
    });
    expect(game.deploy(second).ok).toBe(true);
    expect(game.getFlights()).toHaveLength(2);
  });

  it("logs the insertion on the feed", () => {
    const game = new Game(20, seeded(5));
    game.deploy(legalBuild(game.getRoster()));
    expect(game.getEvents().some((e) => e.message.includes("inbound"))).toBe(true);
  });

  it("clears flights and reissues the board on reset", () => {
    const game = new Game(20, seeded(5));
    game.deploy(legalBuild(game.getRoster()));
    game.reset();
    expect(game.getFlights()).toHaveLength(0);
    expect(game.getRoster().length).toBeGreaterThan(0);
  });

  it("goes for the objectives once it lands", () => {
    const game = new Game(20, seeded(5));
    game.deploy(legalBuild(game.getRoster()));
    for (let i = 0; i < 600 && game.getFlights().length > 0; i += 1) game.tick();

    const landed = game.getPlatoons()[game.getPlatoons().length - 1];
    for (let i = 0; i < 5; i += 1) game.tick();

    expect(landed.assignedObjectiveId).not.toBeNull();
  });
});
