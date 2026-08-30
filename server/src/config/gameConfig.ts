import { Platoon } from "../game/Platoon";
import { Unit } from "../game/Unit";
import {
  Role,
  PlatoonFaction,
  PlatoonStrategy,
  Coordinate,
  ObjectiveType,
  LandingZoneType,
  CAPTURE_RADIUS_METERS,
  emptyPresence,
} from "shared";

export const createUnitByRole = (
  id: string,
  role: Role,
  position: Coordinate
): Unit => {
  return new Unit(id, position, role);
};

/**
 * Roughly one metre, in degrees, at this latitude. Good enough for laying out
 * a start line; anything that measures distance uses the geodesic helpers.
 */
const METERS_LAT = 1 / 111_320;
const METERS_LON = 1 / (111_320 * Math.cos((57.1 * Math.PI) / 180));

const USEC_ANCHOR: Coordinate = [57.1, 26.8];

/** Offset from an anchor by metres north and east. */
const offset = (
  anchor: Coordinate,
  north: number,
  east: number
): Coordinate => [anchor[0] + north * METERS_LAT, anchor[1] + east * METERS_LON];

/**
 * The two platoons start about 1 km apart — outside every weapon's effective
 * range, so they must close before anything happens, but near enough that the
 * approach is watchable.
 *
 * The original seed spread ten units diagonally across roughly 66 km, which is
 * a line drawn on a map rather than a formation, and put every unit permanently
 * beyond the 800 m maximum engagement range.
 */
const SEPARATION_METERS = 1000;

const BEAR_ANCHOR: Coordinate = offset(USEC_ANCHOR, SEPARATION_METERS, 0);

/** A line abreast, `spacing` metres between neighbours, centred on the anchor. */
const lineAbreast = (
  anchor: Coordinate,
  count: number,
  spacing: number
): Coordinate[] =>
  Array.from({ length: count }, (_, index) =>
    offset(anchor, 0, (index - (count - 1) / 2) * spacing)
  );

const ROLES: Role[] = [
  Role.SquadLeader,
  Role.Rifleman,
  Role.LightMachineGunner,
  Role.Grenadier,
  Role.Recon,
  Role.Medic,
];

export const initialPlatoons = (): Platoon[] => {
  const usecPositions = lineAbreast(USEC_ANCHOR, ROLES.length, 40);
  const bearPositions = lineAbreast(BEAR_ANCHOR, ROLES.length, 40);

  return [
    new Platoon(
      "usec-1",
      PlatoonFaction.USEC,
      PlatoonStrategy.PATROL,
      ROLES.map((role, index) =>
        createUnitByRole(`unit${index + 1}`, role, usecPositions[index])
      )
    ),
    new Platoon(
      "bear-1",
      PlatoonFaction.BEAR,
      PlatoonStrategy.AGGRESSIVE,
      ROLES.map((role, index) =>
        createUnitByRole(`unit${index + 1 + ROLES.length}`, role, bearPositions[index])
      )
    ),
  ];
};


// ------------------------------------------------------------- the ground

/**
 * Three objectives in a triangle across the valley, far enough apart that an
 * element cannot sit on two at once and has to choose where to be.
 */
export const initialObjectives = (): ObjectiveType[] => {
  const centre = offset(USEC_ANCHOR, SEPARATION_METERS / 2, 0);

  const places: { id: string; name: string; north: number; east: number }[] = [
    { id: "A", name: "Objective Alpha", north: 520, east: -880 },
    { id: "B", name: "Objective Bravo", north: -80, east: 0 },
    { id: "C", name: "Objective Charlie", north: 520, east: 880 },
  ];

  return places.map(({ id, name, north, east }) => ({
    id,
    name,
    position: offset(centre, north, east),
    radiusMeters: CAPTURE_RADIUS_METERS,
    holder: null,
    capturingFaction: null,
    progress: 0,
    contested: false,
    presence: emptyPresence(),
  }));
};

/**
 * Somewhere to put a helicopter down. Deliberately off the objectives — an
 * element has to cross ground to reach one, which is where the game is.
 */
export const initialLandingZones = (): LandingZoneType[] => {
  const centre = offset(USEC_ANCHOR, SEPARATION_METERS / 2, 0);

  return [
    { id: "LZ-1", name: "LZ Falcon", position: offset(centre, -1150, -1250) },
    { id: "LZ-2", name: "LZ Hawk", position: offset(centre, -1150, 1250) },
    { id: "LZ-3", name: "LZ Kestrel", position: offset(centre, 1500, -1250) },
    { id: "LZ-4", name: "LZ Osprey", position: offset(centre, 1500, 1250) },
  ];
};
