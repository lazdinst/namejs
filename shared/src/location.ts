/** A geographic position as [latitude, longitude] in decimal degrees. */
export type Coordinate = [number, number];

export const EARTH_RADIUS_METERS = 6_371_008.8;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/** Wrap a longitude into [-180, 180). */
const normalizeLongitude = (degrees: number): number =>
  ((degrees + 540) % 360) - 180;

/**
 * Great-circle distance in METERS between two coordinates.
 *
 * Everything in the simulation that compares a distance against a weapon range,
 * a speed, or a visibility radius must go through this. Subtracting raw degrees
 * gives a number that looks plausible and is wrong by five orders of magnitude.
 */
export function distanceMeters(a: Coordinate, b: Coordinate): number {
  const [latA, lonA] = a;
  const [latB, lonB] = b;

  const dLat = toRadians(latB - latA);
  const dLon = toRadians(lonB - lonA);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(latA)) *
      Math.cos(toRadians(latB)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial great-circle bearing from `a` to `b`, in radians, clockwise from north. */
export function initialBearing(a: Coordinate, b: Coordinate): number {
  const latA = toRadians(a[0]);
  const latB = toRadians(b[0]);
  const dLon = toRadians(b[1] - a[1]);

  const y = Math.sin(dLon) * Math.cos(latB);
  const x =
    Math.cos(latA) * Math.sin(latB) -
    Math.sin(latA) * Math.cos(latB) * Math.cos(dLon);

  return Math.atan2(y, x);
}

/**
 * The point reached by travelling `meters` from `origin` along `bearing`.
 *
 * Interpolating through degree space instead would cover the wrong ground
 * distance by up to a fraction of a percent, varying with heading and latitude
 * — which would quietly make a unit's speed depend on the direction it walks.
 */
export function destinationPoint(
  origin: Coordinate,
  bearing: number,
  meters: number
): Coordinate {
  const angular = meters / EARTH_RADIUS_METERS;
  const lat = toRadians(origin[0]);
  const lon = toRadians(origin[1]);

  const sinLat =
    Math.sin(lat) * Math.cos(angular) +
    Math.cos(lat) * Math.sin(angular) * Math.cos(bearing);
  const nextLat = Math.asin(Math.min(1, Math.max(-1, sinLat)));

  const nextLon =
    lon +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat),
      Math.cos(angular) - Math.sin(lat) * sinLat
    );

  return [toDegrees(nextLat), normalizeLongitude(toDegrees(nextLon))];
}

/**
 * Step `meters` from `from` toward `to` along the great circle, stopping
 * exactly on `to` if the step would overshoot.
 */
export function moveTowards(
  from: Coordinate,
  to: Coordinate,
  meters: number
): Coordinate {
  if (meters <= 0) return [from[0], from[1]];

  const total = distanceMeters(from, to);
  if (total === 0 || meters >= total) return [to[0], to[1]];

  return destinationPoint(from, initialBearing(from, to), meters);
}

/** True when two coordinates are within `meters` of each other. */
export function isWithin(
  a: Coordinate,
  b: Coordinate,
  meters: number
): boolean {
  return distanceMeters(a, b) <= meters;
}
