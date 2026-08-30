import { Coordinate, destinationPoint } from "./location";

export enum CoverType {
  None = "none",
  Low = "low",
  Medium = "medium",
  High = "high",
}

export enum TerrainType {
  Clear = "clear",
  Grass = "grass",
  Sand = "sand",
  Snow = "snow",
  Water = "water",
  Mud = "mud",
}

/**
 * Incoming damage multiplier by the cover the target is in. Cover does not
 * change whether a shot connects — it changes how much of it gets through.
 */
export const coverDamageMultiplier: Record<CoverType, number> = {
  [CoverType.None]: 1,
  [CoverType.Low]: 0.75,
  [CoverType.Medium]: 0.5,
  [CoverType.High]: 0.3,
};

/** Movement speed multiplier by ground type. */
export const terrainSpeedMultiplier: Record<TerrainType, number> = {
  [TerrainType.Clear]: 1,
  [TerrainType.Grass]: 0.9,
  [TerrainType.Sand]: 0.8,
  [TerrainType.Snow]: 0.65,
  [TerrainType.Mud]: 0.5,
  [TerrainType.Water]: 0.3,
};

/** What each ground type offers a unit standing in it. */
export const terrainCover: Record<TerrainType, CoverType> = {
  [TerrainType.Clear]: CoverType.None,
  [TerrainType.Water]: CoverType.None,
  [TerrainType.Sand]: CoverType.Low,
  [TerrainType.Snow]: CoverType.Low,
  [TerrainType.Mud]: CoverType.Medium,
  [TerrainType.Grass]: CoverType.High,
};

/** Terrain is sampled in patches this many metres across, not per-point. */
export const TERRAIN_CELL_METERS = 60;

const METERS_PER_DEGREE_LAT = 111_320;

/** Deterministic value hash for a grid cell — same input, same terrain, always. */
function hashCell(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * The terrain grid cell containing a position. Exported so callers that want
 * to draw or reason about patches use the same cells the simulation does.
 */
export function terrainCell(position: Coordinate): [number, number] {
  const [lat, lon] = position;
  const latCell = TERRAIN_CELL_METERS / METERS_PER_DEGREE_LAT;
  const lonCell =
    TERRAIN_CELL_METERS /
    (METERS_PER_DEGREE_LAT * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));

  return [Math.floor(lat / latCell), Math.floor(lon / lonCell)];
}

// Weighted so open ground dominates and water is scarce; the map should be
// mostly fightable, with cover worth moving to rather than everywhere.
const TERRAIN_DISTRIBUTION: { terrain: TerrainType; weight: number }[] = [
  { terrain: TerrainType.Clear, weight: 0.34 },
  { terrain: TerrainType.Grass, weight: 0.24 },
  { terrain: TerrainType.Sand, weight: 0.14 },
  { terrain: TerrainType.Snow, weight: 0.12 },
  { terrain: TerrainType.Mud, weight: 0.11 },
  { terrain: TerrainType.Water, weight: 0.05 },
];

/**
 * Ground type at a position. Procedural and deterministic: there is no terrain
 * layer in the repo, so the world is generated from the coordinate itself. Both
 * server and client derive identical terrain from the same function.
 */
export function terrainAt(position: Coordinate): TerrainType {
  const [y, x] = terrainCell(position);
  const roll = hashCell(x, y);

  let cumulative = 0;
  for (const { terrain, weight } of TERRAIN_DISTRIBUTION) {
    cumulative += weight;
    if (roll < cumulative) return terrain;
  }

  return TerrainType.Clear;
}

/** Cover available at a position, from the terrain there. */
export function coverAt(position: Coordinate): CoverType {
  return terrainCover[terrainAt(position)];
}

/** Speed multiplier at a position, from the terrain there. */
export function speedMultiplierAt(position: Coordinate): number {
  return terrainSpeedMultiplier[terrainAt(position)];
}

/** Ordering of cover quality, for "is this position better than that one". */
export const coverRank: Record<CoverType, number> = {
  [CoverType.None]: 0,
  [CoverType.Low]: 1,
  [CoverType.Medium]: 2,
  [CoverType.High]: 3,
};

export interface CoverCandidate {
  position: Coordinate;
  cover: CoverType;
  rank: number;
  meters: number;
}

/**
 * The best cover within `radiusMeters` of `origin`, sampled on two rings.
 * Deterministic, like the terrain it reads, so a unit told to take cover picks
 * the same spot every tick instead of oscillating between equals.
 */
export function bestCoverNear(
  origin: Coordinate,
  radiusMeters: number,
  samplesPerRing = 8
): CoverCandidate {
  const here: CoverCandidate = {
    position: origin,
    cover: coverAt(origin),
    rank: coverRank[coverAt(origin)],
    meters: 0,
  };

  let best = here;

  for (const radius of [radiusMeters * 0.5, radiusMeters]) {
    for (let i = 0; i < samplesPerRing; i += 1) {
      const bearing = (i / samplesPerRing) * Math.PI * 2;
      const position = destinationPoint(origin, bearing, radius);
      const cover = coverAt(position);
      const candidate: CoverCandidate = {
        position,
        cover,
        rank: coverRank[cover],
        meters: radius,
      };

      // Better cover wins; on a tie the nearer option does, so a unit never
      // walks past equivalent cover to reach more of it.
      if (
        candidate.rank > best.rank ||
        (candidate.rank === best.rank && candidate.meters < best.meters)
      ) {
        best = candidate;
      }
    }
  }

  return best;
}
