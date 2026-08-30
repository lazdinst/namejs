import { Coordinate } from "./location";
import { PlatoonFaction } from "./platoon";

/**
 * A helicopter carrying an element to its landing zone. It exists on the map
 * as a moving marker until it reaches the LZ, at which point the men are
 * placed on the ground and the flight is gone.
 */
export interface FlightType {
  id: string;
  /** The platoon that will exist once this lands. */
  platoonId: string;
  faction: PlatoonFaction;
  callsign: string;
  position: Coordinate;
  origin: Coordinate;
  landingZoneId: string;
  destination: Coordinate;
  /** Metres remaining to the LZ. */
  remainingMeters: number;
  /** Soldiers aboard. */
  aboard: number;
  status: "inbound" | "landing";
}

/** Rotary-wing at a tactical cruise. */
export const HELICOPTER_SPEED_MPS = 55;

/** How far off the edge of the fight a flight starts. */
export const INSERTION_OFFSET_METERS = 3500;

/** The flight is "landing" inside this radius — slowing, marker changes. */
export const LANDING_RADIUS_METERS = 120;

/**
 * Where an inbound flight starts from: well outside the fight, coming in
 * from its own side of the map so USEC and BEAR insert from opposite edges.
 */
export function insertionOrigin(
  faction: PlatoonFaction,
  landingZone: Coordinate
): Coordinate {
  const metersPerDegLat = 111_320;
  const metersPerDegLon =
    111_320 * Math.cos((landingZone[0] * Math.PI) / 180);

  // USEC from the south-west, BEAR from the north-east.
  const sign = faction === PlatoonFaction.USEC ? -1 : 1;
  const north = (INSERTION_OFFSET_METERS / metersPerDegLat) * sign;
  const east = (INSERTION_OFFSET_METERS / metersPerDegLon) * sign * 0.6;

  return [landingZone[0] + north, landingZone[1] + east];
}
