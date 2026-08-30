import {
  ElementBuild,
  validateElement,
  Coordinate,
  destinationPoint,
  generateRoster,
  SoldierCard,
  LandingZoneType,
} from "shared";
import { Platoon } from "./Platoon";
import { Unit } from "./Unit";

/** Metres between men in the stick as they come off the aircraft. */
const STICK_SPACING_METERS = 7;

/**
 * Turn a validated build into a platoon standing on the LZ. Men are placed
 * in a line abreast around the touchdown point rather than stacked on it.
 */
export function buildPlatoon(
  platoonId: string,
  build: ElementBuild,
  landingZone: LandingZoneType
): Platoon {
  const problems = validateElement(build);
  if (problems.length > 0) {
    throw new Error(problems.map((p) => p.message).join("; "));
  }

  const count = build.slots.length;
  const units = build.slots.map((slot, index) => {
    const offsetMeters = (index - (count - 1) / 2) * STICK_SPACING_METERS;
    const position: Coordinate = destinationPoint(
      landingZone.position,
      Math.PI / 2,
      offsetMeters
    );

    return Unit.fromSoldier(
      `${platoonId}-${index + 1}`,
      position,
      slot.soldier,
      slot.loadout
    );
  });

  const platoon = new Platoon(platoonId, build.faction, build.strategy, units);
  platoon.name = build.name;
  return platoon;
}

/** A fresh draft board, seeded so a session can be replayed. */
export function draftBoard(random: () => number): SoldierCard[] {
  return generateRoster(random, 3);
}
