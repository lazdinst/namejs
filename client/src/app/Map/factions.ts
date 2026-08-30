import {
  PlatoonFaction,
  HealthStatus,
  UnitStatusType,
  CoverType,
  ShockState,
  MoraleState,
} from "shared";

/**
 * The map is monochrome apart from state: identity is drawn in greys and told
 * apart by how the health ring is stroked — solid friendly, segmented hostile —
 * the way real military symbology leans on shape rather than colour. Hue is
 * spent only on condition and on contact.
 */
export type FactionFrame = "friendly" | "hostile";

export const factionFrames: Record<PlatoonFaction, FactionFrame> = {
  [PlatoonFaction.USEC]: "friendly",
  [PlatoonFaction.BEAR]: "hostile",
};

/** Friendly reads brighter than hostile, which is the only tonal cue. */
export const factionInk: Record<PlatoonFaction, string> = {
  [PlatoonFaction.USEC]: "#D8D8D8",
  [PlatoonFaction.BEAR]: "#828282",
};

export const factionLabels: Record<PlatoonFaction, string> = {
  [PlatoonFaction.USEC]: "USEC",
  [PlatoonFaction.BEAR]: "BEAR",
};

/**
 * Condition is the one thing on the badge that carries its own hue: green so a
 * ring reads as health at a glance rather than as more chrome. Luminance still
 * does the ranking — bright is whole, dim is spent — so the ramp survives being
 * seen small, in the corner of the eye, or by a red-green colourblind viewer.
 *
 * These are held deliberately lighter and duller than ACCENT so a unit in
 * contact still stands out against a map full of healthy green rings.
 */
export const healthInk: Record<HealthStatus, string> = {
  healthy: "#7FCB95",
  wounded: "#4F9366",
  critical: "#2E5C40",
  kia: "#253028",
};

/** The single accent, reserved for a unit actively in contact. */
export const ACCENT = "#3DB85A";

/**
 * The one alarm colour, spent only on a man who is pinned or bleeding out.
 * A second hue is a real departure from an otherwise monochrome map, and it is
 * here because "this soldier is dying" is the one state that has to break
 * through a screen the reader is only half watching.
 */
export const ALERT = "#B0473C";

/**
 * A casualty's cross. Matches the --destructive token the engagement feed uses
 * for a kill, so a death reads the same in the roster and on the map.
 */
export const KIA_INK = "#CC4C3E";
export const GRID_INK = "#2C2C2C";
export const DEAD_INK = "#4D4D4D";

export const statusInk: Record<UnitStatusType, string> = {
  [UnitStatusType.Idle]: "#606060",
  [UnitStatusType.Moving]: "#C4C4C4",
  [UnitStatusType.Engaged]: ACCENT,
  [UnitStatusType.Pinned]: ALERT,
  [UnitStatusType.Withdrawing]: "#8A8A8A",
  [UnitStatusType.Down]: ALERT,
  [UnitStatusType.Treating]: ACCENT,
  [UnitStatusType.Kia]: "#3C3C3C",
};

export const statusLabels: Record<UnitStatusType, string> = {
  [UnitStatusType.Idle]: "IDLE",
  [UnitStatusType.Moving]: "MOVING",
  [UnitStatusType.Engaged]: "ENGAGED",
  [UnitStatusType.Pinned]: "PINNED",
  [UnitStatusType.Withdrawing]: "WITHDRAWING",
  [UnitStatusType.Down]: "DOWN",
  [UnitStatusType.Treating]: "TREATING",
  [UnitStatusType.Kia]: "KIA",
};

export const coverLabels: Record<CoverType, string> = {
  [CoverType.None]: "EXPOSED",
  [CoverType.Low]: "LOW COVER",
  [CoverType.Medium]: "MED COVER",
  [CoverType.High]: "HVY COVER",
};

/** Cover as a filled-pip count, 0–3, for the readouts. */
export const coverPips: Record<CoverType, number> = {
  [CoverType.None]: 0,
  [CoverType.Low]: 1,
  [CoverType.Medium]: 2,
  [CoverType.High]: 3,
};

export const UNIT_MAX_HEALTH = 420;

/** Shock bands, dim to alarming. Only the worst band earns a warm colour. */
export const shockInk: Record<ShockState, string> = {
  stable: "#6E6E6E",
  compensating: "#C4C4C4",
  shock: ALERT,
  critical: ALERT,
};

export const shockLabels: Record<ShockState, string> = {
  stable: "STABLE",
  compensating: "COMPENSATING",
  shock: "SHOCK",
  critical: "CRITICAL",
};

export const moraleLabels: Record<MoraleState, string> = {
  steady: "STEADY",
  shaken: "SHAKEN",
  broken: "BROKEN",
};
