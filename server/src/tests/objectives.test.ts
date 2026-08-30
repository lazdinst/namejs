import { describe, it, expect } from "vitest";
import {
  PlatoonFaction,
  Coordinate,
  captureRate,
  holdsAll,
  tallyHeld,
  distanceMeters,
  CAPTURE_MIN_UNITS,
  CAPTURE_SECONDS,
  CAPTURE_MAX_SPEED_MULTIPLIER,
  ObjectiveType,
  emptyPresence,
} from "shared";
import { Game } from "../game/Game";

const alwaysHit = () => 0;

/** Put `count` USEC men on an objective and everyone else far away. */
const occupy = (game: Game, objectiveId: string, count: number, faction = 0) => {
  game.setAutonomous(false);
  const objective = game.getObjectives().find((o) => o.id === objectiveId)!;
  const [usec, bear] = game.getPlatoons();
  const own = faction === 0 ? usec : bear;
  const other = faction === 0 ? bear : usec;

  own.units.forEach((unit, i) => {
    if (i < count) unit.move([...objective.position] as Coordinate);
    else unit.move([57.0, 26.0]);
  });
  other.units.forEach((unit) => unit.move([57.0, 26.0]));

  return objective;
};

const ticksFor = (seconds: number, timeScale = 1) =>
  Math.ceil(seconds / (0.1 * timeScale)) + 1;

describe("capture rate", () => {
  it("needs a minimum number of men before anything happens", () => {
    expect(captureRate(0)).toBe(0);
    expect(captureRate(CAPTURE_MIN_UNITS - 1)).toBe(0);
    expect(captureRate(CAPTURE_MIN_UNITS)).toBeGreaterThan(0);
  });

  it("takes the nominal time at minimum strength", () => {
    expect(1 / captureRate(CAPTURE_MIN_UNITS)).toBeCloseTo(CAPTURE_SECONDS, 5);
  });

  it("goes faster with more men, but not without limit", () => {
    expect(captureRate(CAPTURE_MIN_UNITS + 2)).toBeGreaterThan(
      captureRate(CAPTURE_MIN_UNITS)
    );
    expect(captureRate(50)).toBeCloseTo(
      CAPTURE_MAX_SPEED_MULTIPLIER / CAPTURE_SECONDS,
      5
    );
  });
});

describe("the ground", () => {
  it("lays out three objectives and some landing zones", () => {
    const game = new Game();

    expect(game.getObjectives().map((o) => o.id)).toEqual(["A", "B", "C"]);
    expect(game.getLandingZones().length).toBeGreaterThanOrEqual(3);
  });

  it("starts every objective unheld", () => {
    for (const objective of new Game().getObjectives()) {
      expect(objective.holder).toBeNull();
      expect(objective.progress).toBe(0);
    }
  });

  it("spaces objectives so one element cannot hold two at once", () => {
    const [a, b, c] = new Game().getObjectives();

    for (const [x, y] of [[a, b], [b, c], [a, c]] as const) {
      expect(distanceMeters(x.position, y.position)).toBeGreaterThan(
        x.radiusMeters + y.radiusMeters
      );
    }
  });

  it("keeps landing zones off the objectives", () => {
    const game = new Game();

    for (const lz of game.getLandingZones()) {
      for (const objective of game.getObjectives()) {
        expect(distanceMeters(lz.position, objective.position)).toBeGreaterThan(
          objective.radiusMeters
        );
      }
    }
  });
});

describe("taking ground", () => {
  it("makes no progress with too few men", () => {
    const game = new Game(1, alwaysHit);
    const objective = occupy(game, "B", CAPTURE_MIN_UNITS - 1);

    for (let i = 0; i < 50; i += 1) game.tick();

    expect(objective.progress).toBe(0);
    expect(objective.holder).toBeNull();
  });

  it("counts presence per faction", () => {
    const game = new Game(1, alwaysHit);
    const objective = occupy(game, "B", 3);
    game.tick();

    expect(objective.presence[PlatoonFaction.USEC]).toBe(3);
    expect(objective.presence[PlatoonFaction.BEAR]).toBe(0);
  });

  it("flips after enough unopposed presence", () => {
    const game = new Game(1, alwaysHit);
    const objective = occupy(game, "B", CAPTURE_MIN_UNITS);

    for (let i = 0; i < ticksFor(CAPTURE_SECONDS); i += 1) game.tick();

    expect(objective.holder).toBe(PlatoonFaction.USEC);
    expect(objective.progress).toBe(0);
    expect(game.getEvents().some((e) => e.type === "objective")).toBe(true);
  });

  it("flips sooner with more men on it", () => {
    const timeToTake = (count: number) => {
      const game = new Game(1, alwaysHit);
      const objective = occupy(game, "B", count);
      let t = 0;
      while (!objective.holder && t < 2000) {
        game.tick();
        t += 1;
      }
      return t;
    };

    expect(timeToTake(5)).toBeLessThan(timeToTake(CAPTURE_MIN_UNITS));
  });

  it("stalls while both sides are on the ground", () => {
    const game = new Game(1, alwaysHit);
    game.setAutonomous(false);
    const objective = game.getObjectives()[1];
    const [usec, bear] = game.getPlatoons();

    for (const unit of usec.units.slice(0, 3)) {
      unit.move([...objective.position] as Coordinate);
    }
    for (const unit of bear.units.slice(0, 3)) {
      unit.move([...objective.position] as Coordinate);
    }
    // Keep them from shooting each other so presence, not casualties, decides.
    for (const unit of [...usec.units, ...bear.units]) unit.magazine = 0;

    for (let i = 0; i < 40; i += 1) game.tick();

    expect(objective.contested).toBe(true);
    expect(objective.progress).toBe(0);
    expect(objective.holder).toBeNull();
  });

  it("does not count a casualty on the ground as holding it", () => {
    const game = new Game(1, alwaysHit);
    const objective = occupy(game, "B", CAPTURE_MIN_UNITS);
    game.getPlatoons()[0].units[0].bloodVolume = 0.3;
    game.getPlatoons()[0].units[0].bleed(0.1);

    for (let i = 0; i < 50; i += 1) game.tick();

    expect(objective.presence[PlatoonFaction.USEC]).toBe(CAPTURE_MIN_UNITS - 1);
    expect(objective.progress).toBe(0);
  });

  it("bleeds progress back when abandoned", () => {
    const game = new Game(1, alwaysHit);
    const objective = occupy(game, "B", CAPTURE_MIN_UNITS);

    for (let i = 0; i < ticksFor(CAPTURE_SECONDS / 2); i += 1) game.tick();
    const partial = objective.progress;
    expect(partial).toBeGreaterThan(0.3);

    for (const unit of game.getPlatoons()[0].units) unit.move([57.0, 26.0]);
    for (let i = 0; i < 100; i += 1) game.tick();

    expect(objective.progress).toBeLessThan(partial);
  });

  it("can be taken back", () => {
    const game = new Game(1, alwaysHit);
    const objective = occupy(game, "B", 3);
    for (let i = 0; i < ticksFor(CAPTURE_SECONDS); i += 1) game.tick();
    expect(objective.holder).toBe(PlatoonFaction.USEC);

    // Nobody shoots during the retake — this is about presence, not a fight.
    for (const unit of game.getPlatoons().flatMap((p) => p.units)) {
      unit.magazine = 0;
      unit.bleeds = [];
    }

    occupy(game, "B", 4, 1);
    for (let i = 0; i < ticksFor(CAPTURE_SECONDS); i += 1) game.tick();

    expect(objective.holder).toBe(PlatoonFaction.BEAR);
    expect(
      game.getEvents().some((e) => e.message.includes("from USEC"))
    ).toBe(true);
  });
});

describe("victory by objectives", () => {
  const held = (holder: PlatoonFaction | null): ObjectiveType => ({
    id: "x",
    name: "x",
    position: [0, 0],
    radiusMeters: 1,
    holder,
    capturingFaction: null,
    progress: 0,
    contested: false,
    presence: emptyPresence(),
  });

  it("requires every objective, not a majority", () => {
    const two = [held(PlatoonFaction.USEC), held(PlatoonFaction.USEC), held(null)];
    expect(holdsAll(two, PlatoonFaction.USEC)).toBe(false);

    const all = [held(PlatoonFaction.USEC), held(PlatoonFaction.USEC), held(PlatoonFaction.USEC)];
    expect(holdsAll(all, PlatoonFaction.USEC)).toBe(true);
  });

  it("never declares a winner on an empty map", () => {
    expect(holdsAll([], PlatoonFaction.USEC)).toBe(false);
  });

  it("tallies what each side holds", () => {
    const tally = tallyHeld([
      held(PlatoonFaction.USEC),
      held(PlatoonFaction.BEAR),
      held(PlatoonFaction.USEC),
    ]);

    expect(tally[PlatoonFaction.USEC]).toBe(2);
    expect(tally[PlatoonFaction.BEAR]).toBe(1);
  });

  it("ends the game when one side holds all three", () => {
    const game = new Game(1, alwaysHit);
    game.setAutonomous(false);
    for (const objective of game.getObjectives()) {
      objective.holder = PlatoonFaction.BEAR;
    }

    game.tick();

    const outcome = game.getOutcome();
    expect(outcome?.reason).toBe("objectives");
    expect(outcome?.winnerId).toBe("bear-1");
  });
});

describe("elements go for the ground on their own", () => {
  it("assigns every element an objective it does not hold", () => {
    const game = new Game(20, alwaysHit);
    game.tick();

    for (const platoon of game.getPlatoons()) {
      expect(platoon.assignedObjectiveId).not.toBeNull();
    }
  });

  it("moves toward it without orders", () => {
    const game = new Game(20, alwaysHit);
    const platoon = game.getPlatoons()[0];
    const unit = platoon.units[1];

    game.tick();
    const objective = game
      .getObjectives()
      .find((o) => o.id === platoon.assignedObjectiveId)!;
    const before = distanceMeters(unit.position, objective.position);

    for (let i = 0; i < 40; i += 1) game.tick();

    expect(distanceMeters(unit.position, objective.position)).toBeLessThan(
      before
    );
  });

  it("plays a whole match through to someone holding the field", () => {
    const seeded = (n: number) => () => {
      n = (n * 1103515245 + 12345) % 2147483648;
      return n / 2147483648;
    };
    const game = new Game(20, seeded(7));

    for (let i = 0; i < 12000 && !game.getOutcome(); i += 1) game.tick();

    expect(game.getOutcome()).not.toBeNull();
  });
});
