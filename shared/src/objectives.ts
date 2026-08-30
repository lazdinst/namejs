import { Coordinate } from "./location";
import { PlatoonFaction } from "./platoon";

/**
 * A piece of ground worth taking. Everything about a mission — assault,
 * defend, delay — is a configuration of this one primitive plus a victory
 * condition, so it is deliberately plain.
 */
export interface ObjectiveType {
  id: string;
  name: string;
  position: Coordinate;
  radiusMeters: number;
  /** Who currently owns it, or null while nobody has taken it. */
  holder: PlatoonFaction | null;
  /** Faction currently making progress on it. */
  capturingFaction: PlatoonFaction | null;
  /** Capture progress toward `capturingFaction`, 0–1. */
  progress: number;
  /** True while both sides have men inside the radius. */
  contested: boolean;
  /** Effective units inside the radius, per faction. */
  presence: Record<PlatoonFaction, number>;
}

/** A place to put a helicopter down. */
export interface LandingZoneType {
  id: string;
  name: string;
  position: Coordinate;
}

/** How close a soldier has to be to count toward taking an objective. */
export const CAPTURE_RADIUS_METERS = 70;

/** Simulated seconds of unopposed presence needed to flip an objective. */
export const CAPTURE_SECONDS = 60;

/** Men required inside the radius before capture progresses at all. */
export const CAPTURE_MIN_UNITS = 2;

/**
 * Progress bleeds back when nobody is holding the ground, so an objective
 * half-taken and abandoned does not stay half-taken forever.
 */
export const CAPTURE_DECAY_PER_SECOND = 1 / (CAPTURE_SECONDS * 2.5);

/** Extra men beyond the minimum speed the capture up, to this ceiling. */
export const CAPTURE_MAX_SPEED_MULTIPLIER = 2;

export const emptyPresence = (): Record<PlatoonFaction, number> => ({
  [PlatoonFaction.USEC]: 0,
  [PlatoonFaction.BEAR]: 0,
});

/**
 * How fast `count` men take ground. The minimum gets you moving; every man
 * past it helps, with diminishing returns so a whole platoon standing on one
 * point is not instant.
 */
export function captureRate(count: number): number {
  if (count < CAPTURE_MIN_UNITS) return 0;

  const extra = count - CAPTURE_MIN_UNITS;
  const multiplier = Math.min(
    CAPTURE_MAX_SPEED_MULTIPLIER,
    1 + extra * 0.25
  );

  return multiplier / CAPTURE_SECONDS;
}

/** True when one faction holds every objective on the map. */
export function holdsAll(
  objectives: ObjectiveType[],
  faction: PlatoonFaction
): boolean {
  return (
    objectives.length > 0 &&
    objectives.every((objective) => objective.holder === faction)
  );
}

/** Objectives held per faction, for the scoreboard. */
export function tallyHeld(
  objectives: ObjectiveType[]
): Record<PlatoonFaction, number> {
  const tally = emptyPresence();

  for (const objective of objectives) {
    if (objective.holder) tally[objective.holder] += 1;
  }

  return tally;
}
