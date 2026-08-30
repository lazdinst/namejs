import { describe, it, expect } from "vitest";
import {
  Role,
  Coordinate,
  UnitStatusType,
  PlatoonStrategy,
  moraleStateFor,
  suppressionAccuracy,
  suppressionSpeed,
  vitalsFor,
  shockStateFor,
  bleedFromDamage,
  shockAccuracy,
  PINNED_THRESHOLD,
  BLOOD_INCAPACITATED,
  BLOOD_FATAL,
  CONTACT_REPORT_DELAY_SECONDS,
  SUPPRESSION_SPLASH_METERS,
} from "shared";
import { Game } from "../game/Game";
import { Unit, UNIT_MAX_HEALTH } from "../game/Unit";

const alwaysHit = () => 0;
const at = (m: number): Coordinate => [57.1 + m / 111_320, 26.8];

const closeToContact = (game: Game) => {
  const [usec, bear] = game.getPlatoons();
  for (const unit of bear.units) {
    unit.move([...usec.units[0].position] as Coordinate);
  }
};

// ------------------------------------------------------------- suppression

describe("suppression", () => {
  it("degrades a shooter's accuracy the harder it is being shot at", () => {
    expect(suppressionAccuracy(0)).toBe(1);
    expect(suppressionAccuracy(0.5)).toBeLessThan(1);
    expect(suppressionAccuracy(1)).toBeLessThan(suppressionAccuracy(0.5));
  });

  it("slows a unit under fire", () => {
    expect(suppressionSpeed(0)).toBe(1);
    expect(suppressionSpeed(1)).toBeLessThan(suppressionSpeed(0.3));
  });

  it("pins a unit once fire gets heavy enough", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    expect(unit.isPinned()).toBe(false);

    unit.suppress(PINNED_THRESHOLD + 0.05);

    expect(unit.isPinned()).toBe(true);
  });

  it("bleeds off once the fire lifts", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    unit.suppress(0.8);

    unit.settleNerves(30, false);

    expect(unit.suppression).toBeLessThan(0.8);
  });

  it("never exceeds full suppression", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    unit.suppress(5);
    expect(unit.suppression).toBe(1);
  });

  it("builds under sustained fire in a real engagement", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);

    for (let i = 0; i < 8; i += 1) game.tick();

    const suppressed = game
      .getPlatoons()
      .flatMap((p) => p.units)
      .filter((u) => u.isAlive() && u.suppression > 0.2);

    expect(suppressed.length).toBeGreaterThan(0);
  });

  it("splashes onto the friends beside the target", () => {
    const game = new Game(1, alwaysHit);
    const [usec, bear] = game.getPlatoons();

    // Stack BEAR tightly so the splash radius covers neighbours.
    for (const unit of bear.units) {
      unit.move([...usec.units[0].position] as Coordinate);
    }

    for (let i = 0; i < 4; i += 1) game.tick();

    const touched = bear.units.filter((u) => u.suppression > 0);
    expect(touched.length).toBeGreaterThan(1);
    expect(SUPPRESSION_SPLASH_METERS).toBeGreaterThan(0);
  });

  it("holds a pinned unit in place", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);
    for (let i = 0; i < 6; i += 1) game.tick();

    for (const unit of game.getPlatoons().flatMap((p) => p.units)) {
      if (unit.isPinned() && !unit.hasOrders && unit.isEffective()) {
        expect(unit.destination).toBeNull();
      }
    }
  });
});

// ------------------------------------------------------------------ morale

describe("morale", () => {
  it("breaks quickly and recovers slowly, with hysteresis", () => {
    expect(moraleStateFor("steady", 0.2)).toBe("broken");
    // Climbing back out takes more than crossing the line it fell past.
    expect(moraleStateFor("broken", 0.35)).toBe("broken");
    expect(moraleStateFor("broken", 0.5)).toBe("shaken");
    expect(moraleStateFor("shaken", 0.65)).toBe("shaken");
    expect(moraleStateFor("shaken", 0.8)).toBe("steady");
  });

  it("drains when a unit is wounded", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    unit.takeDamage(120);
    expect(unit.morale).toBeLessThan(1);
  });

  it("recovers out of contact", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    unit.drainMorale(0.5);
    const low = unit.morale;

    unit.settleNerves(30, false);

    expect(unit.morale).toBeGreaterThan(low);
  });

  it("sends a broken unit back toward its rally point", () => {
    const game = new Game(20, alwaysHit);
    const unit = game.getPlatoons()[1].units[1];

    // Push it forward first — a unit already standing on its rally point has
    // nowhere to withdraw to.
    unit.move([unit.spawnPosition[0] - 0.004, unit.spawnPosition[1]]);
    unit.drainMorale(1);

    game.tick();

    expect(unit.isBroken()).toBe(true);
    expect(unit.status).toBe(UnitStatusType.Withdrawing);
    expect(unit.destination).not.toBeNull();
  });

  it("costs the whole platoon when the squad leader falls", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);
    const bear = game.getPlatoons()[1];
    const leader = bear.units.find((u) => u.role === Role.SquadLeader)!;
    const mate = bear.units.find((u) => u.role === Role.Rifleman)!;
    const before = mate.morale;

    leader.takeDamage(UNIT_MAX_HEALTH);
    game.tick();

    expect(mate.morale).toBeLessThan(before);
  });

  it("logs a break once, not every tick", () => {
    const game = new Game(20, alwaysHit);
    game.getPlatoons()[0].units[1].drainMorale(1);

    for (let i = 0; i < 12; i += 1) game.tick();

    const breaks = game
      .getEvents()
      .filter((e) => e.type === "morale" && e.message.includes("broken"));

    expect(breaks.length).toBeLessThanOrEqual(2);
  });
});

// ------------------------------------------------------- contact reporting

describe("contact reporting", () => {
  it("starts unaware", () => {
    expect(new Game().getPlatoons()[0].alertState).toBe("unaware");
  });

  it("passes the word after a delay, not instantly", () => {
    const game = new Game(1, alwaysHit); // 0.1 sim seconds per tick
    closeToContact(game);

    game.tick();
    expect(game.getPlatoons()[1].alertState).toBe("reporting");

    // Not enough time for the report to land yet.
    for (let i = 0; i < 5; i += 1) game.tick();
    expect(game.getPlatoons()[1].alertState).toBe("reporting");

    const ticksForReport = Math.ceil(CONTACT_REPORT_DELAY_SECONDS / 0.1);
    for (let i = 0; i < ticksForReport; i += 1) game.tick();

    expect(game.getPlatoons()[1].alertState).toBe("alerted");
  });

  it("records where contact was made", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);
    game.tick();

    expect(game.getPlatoons()[1].lastContact).not.toBeNull();
  });

  it("turns a patrolling element toward reported contact", () => {
    const game = new Game(20, alwaysHit);
    game.getPlatoons()[0].strategy = PlatoonStrategy.PATROL;
    const far = game.getPlatoons()[0].units[4];

    for (let i = 0; i < 200; i += 1) {
      game.tick();
      if (game.getPlatoons()[0].alertState === "alerted") break;
    }

    expect(game.getPlatoons()[0].alertState).toBe("alerted");
    expect(far.spawnPosition).toBeDefined();
  });

  it("logs the report and the alert", () => {
    const game = new Game(1, alwaysHit);
    closeToContact(game);
    for (let i = 0; i < 260; i += 1) game.tick();

    const comms = game.getEvents().filter((e) => e.type === "comms");
    expect(comms.length).toBeGreaterThan(0);
  });
});

// ------------------------------------------------------ bleeding and vitals

describe("vitals", () => {
  it("reads normal for a whole man", () => {
    const v = vitalsFor(1);
    expect(v.heartRate).toBeCloseTo(70, 0);
    expect(v.systolic).toBeCloseTo(120, 0);
    expect(v.shockIndex).toBeLessThan(0.7);
    expect(v.state).toBe("stable");
  });

  it("raises the pulse and drops the pressure as volume is lost", () => {
    const whole = vitalsFor(1);
    const bled = vitalsFor(0.6);

    expect(bled.heartRate).toBeGreaterThan(whole.heartRate);
    expect(bled.systolic).toBeLessThan(whole.systolic);
  });

  it("climbs the shock index monotonically as volume falls", () => {
    const samples = [1, 0.85, 0.7, 0.55, 0.4].map((v) => vitalsFor(v).shockIndex);

    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]).toBeGreaterThan(samples[i - 1]);
    }
  });

  it("bands the shock index the way a medic would read it", () => {
    expect(shockStateFor(0.6)).toBe("stable");
    expect(shockStateFor(1.0)).toBe("compensating");
    expect(shockStateFor(1.5)).toBe("shock");
    expect(shockStateFor(2.2)).toBe("critical");
  });

  it("costs a casualty their aim", () => {
    expect(shockAccuracy(0.6)).toBe(1);
    expect(shockAccuracy(1.6)).toBeLessThan(1);
  });
});

describe("bleeding", () => {
  it("opens a bleed sized to the wound", () => {
    expect(bleedFromDamage(5)).toBe("none");
    expect(bleedFromDamage(30)).toBe("light");
    expect(bleedFromDamage(90)).toBe("heavy");
  });

  it("starts a unit whole and unbleeding", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    expect(unit.bloodVolume).toBe(1);
    expect(unit.isBleeding()).toBe(false);
    expect(unit.vitals.state).toBe("stable");
  });

  it("opens a wound when hit hard, and drains volume over time", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    unit.takeDamage(90);
    expect(unit.isBleeding()).toBe(true);

    const before = unit.bloodVolume;
    unit.bleed(30);

    expect(unit.bloodVolume).toBeLessThan(before);
    expect(unit.vitals.shockIndex).toBeGreaterThan(0.6);
  });

  it("puts a casualty on the ground before it kills them", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    unit.bloodVolume = BLOOD_INCAPACITATED - 0.01;
    unit.bleed(0.1);

    expect(unit.incapacitated).toBe(true);
    expect(unit.isAlive()).toBe(true);
    expect(unit.isEffective()).toBe(false);
  });

  it("kills once volume runs out", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    unit.bloodVolume = BLOOD_FATAL - 0.01;
    unit.bleed(0.1);

    expect(unit.isAlive()).toBe(false);
  });

  it("bleeds a downed casualty far slower, which is the medic's window", () => {
    const upright = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const down = new Unit("b", [57.1, 26.8], Role.Rifleman);
    for (const u of [upright, down]) u.takeDamage(90);
    down.incapacitated = true;

    const beforeUp = upright.bloodVolume;
    const beforeDown = down.bloodVolume;
    upright.bleed(20);
    down.bleed(20);

    expect(beforeUp - upright.bloodVolume).toBeGreaterThan(
      beforeDown - down.bloodVolume
    );
  });

  it("closes a light wound on its own, but never a heavy one", () => {
    const light = new Unit("a", [57.1, 26.8], Role.Rifleman);
    const heavy = new Unit("b", [57.1, 26.8], Role.Rifleman);
    light.takeDamage(20);
    heavy.takeDamage(90);

    for (let i = 0; i < 40; i += 1) {
      light.bleed(10);
      heavy.bleed(10);
    }

    expect(light.isBleeding()).toBe(false);
    expect(heavy.isBleeding()).toBe(true);
  });

  it("stops a casualty on the ground from fighting or being fought", () => {
    const unit = new Unit("u", [57.1, 26.8], Role.Rifleman);
    unit.bloodVolume = BLOOD_INCAPACITATED - 0.01;
    unit.bleed(0.1);

    expect(unit.canFire()).toBe(false);
    unit.setDestination([57.2, 26.8]);
    expect(unit.advance(10)).toBe(0);
  });
});

// ------------------------------------------------------------------- medic

describe("medic", () => {
  it("is issued to every element, with a real aid bag", () => {
    for (const platoon of new Game().getPlatoons()) {
      const medic = platoon.units.find((u) => u.role === Role.Medic);
      expect(medic).toBeDefined();
      expect(medic!.inventory.medicalSupplies.heavyBleedingBandages).toBeGreaterThan(4);
    }
  });

  it("moves to the worst casualty in its element", () => {
    const game = new Game(20, alwaysHit);
    const usec = game.getPlatoons()[0];
    const medic = usec.units.find((u) => u.role === Role.Medic)!;
    const casualty = usec.units[1];

    casualty.takeDamage(200);
    game.tick();

    expect(medic.patient).toBe(casualty.id);
  });

  it("dresses the wound and stops the bleeding", () => {
    const game = new Game(20, alwaysHit);
    game.setAutonomous(true);
    const usec = game.getPlatoons()[0];
    const medic = usec.units.find((u) => u.role === Role.Medic)!;
    const casualty = usec.units[1];

    casualty.takeDamage(90);
    medic.move([...casualty.position] as Coordinate);

    for (let i = 0; i < 60 && casualty.isBleeding(); i += 1) game.tick();

    expect(casualty.isBleeding()).toBe(false);
    expect(
      game.getEvents().some((e) => e.type === "medical")
    ).toBe(true);
  });

  it("puts volume back into a casualty it is working on", () => {
    const game = new Game(20, alwaysHit);
    const usec = game.getPlatoons()[0];
    const medic = usec.units.find((u) => u.role === Role.Medic)!;
    const casualty = usec.units[1];

    casualty.takeDamage(150);
    casualty.bleed(60);
    const low = casualty.bloodVolume;
    medic.move([...casualty.position] as Coordinate);

    for (let i = 0; i < 30; i += 1) game.tick();

    expect(casualty.bloodVolume).toBeGreaterThan(low);
  });

  it("spends a bandage per wound dressed", () => {
    const game = new Game(20, alwaysHit);
    const usec = game.getPlatoons()[0];
    const medic = usec.units.find((u) => u.role === Role.Medic)!;
    const casualty = usec.units[1];
    const before = medic.inventory.medicalSupplies.heavyBleedingBandages;

    casualty.takeDamage(90);
    medic.move([...casualty.position] as Coordinate);
    for (let i = 0; i < 60 && casualty.isBleeding(); i += 1) game.tick();

    expect(
      medic.inventory.medicalSupplies.heavyBleedingBandages
    ).toBeLessThan(before);
  });
});

// ----------------------------------------------------------------- outcome

describe("battle outcome", () => {
  it("is undecided at the start", () => {
    expect(new Game().getOutcome()).toBeNull();
  });

  it("is decided when one side stops being a fighting force", () => {
    const game = new Game(20, alwaysHit);

    for (let i = 0; i < 3000 && !game.getOutcome(); i += 1) game.tick();

    const outcome = game.getOutcome();
    expect(outcome).not.toBeNull();
    expect(outcome!.winnerId).not.toBe(outcome!.loserId);
  });

  it("usually ends in a rout rather than annihilation", () => {
    // The whole point of suppression and morale: a beaten element withdraws.
    const seeded = (n: number) => () => {
      n = (n * 1103515245 + 12345) % 2147483648;
      return n / 2147483648;
    };

    let wipes = 0;
    const runs = 8;

    for (let r = 0; r < runs; r += 1) {
      const game = new Game(20, seeded(r + 1));
      let decided = -1;
      for (let t = 0; t < 6000; t += 1) {
        game.tick();
        if (decided < 0 && game.getOutcome()) decided = t;
        if (decided >= 0 && t > decided + 400) break;
      }
      if (game.getPlatoons().some((p) => p.isEliminated())) wipes += 1;
    }

    expect(wipes).toBeLessThan(runs / 2);
  });

  it("stops pursuing an element that has already lost", () => {
    const game = new Game(20, alwaysHit);
    game.clearObjectives(); // otherwise the victors go on to take ground
    for (let i = 0; i < 3000 && !game.getOutcome(); i += 1) game.tick();

    const winner = game
      .getPlatoons()
      .find((p) => p.id === game.getOutcome()!.winnerId)!;

    for (let i = 0; i < 40; i += 1) game.tick();

    // The victors hold the ground rather than chasing broken men down.
    const chasing = winner
      .effectiveUnits()
      .filter((u) => u.status === UnitStatusType.Moving && !u.hasOrders);

    expect(chasing.length).toBeLessThan(winner.units.length);
  });
});
