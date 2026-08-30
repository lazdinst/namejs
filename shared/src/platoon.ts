import { UnitType } from "./unit";

export interface PlatoonType {
  id: string;
  faction: PlatoonFaction;
  units: UnitType[];
  strategy: PlatoonStrategy;
}

export enum PlatoonFaction {
  USEC = "usec",
  BEAR = "bear",
}

export const platoonFactions = Object.values(PlatoonFaction);

export enum PlatoonStrategy {
  AGGRESSIVE = "aggressive",
  DEFENSIVE = "defensive",
  PATROL = "patrol",
  CAUTIOUS = "cautious",
}

/**
 * What each posture actually does in the simulation. The pros and cons below
 * are not flavour — each line corresponds to a mechanic, so the menu that
 * shows them is describing real trade-offs.
 */
export interface StrategyInfo {
  strategy: PlatoonStrategy;
  label: string;
  summary: string;
  pros: string[];
  cons: string[];
}

/** Movement multiplier per posture. */
export const strategySpeed: Record<PlatoonStrategy, number> = {
  [PlatoonStrategy.AGGRESSIVE]: 1.1,
  [PlatoonStrategy.DEFENSIVE]: 1,
  [PlatoonStrategy.PATROL]: 1,
  [PlatoonStrategy.CAUTIOUS]: 0.8,
};

/** Fraction of weapon range at which the element stops closing and shoots. */
export const strategyStandoff: Record<PlatoonStrategy, number> = {
  [PlatoonStrategy.AGGRESSIVE]: 0.6,
  [PlatoonStrategy.DEFENSIVE]: 0.9,
  [PlatoonStrategy.PATROL]: 0.75,
  [PlatoonStrategy.CAUTIOUS]: 0.92,
};

/** Multiplier on enemy hit chance against this element — movement discipline. */
export const strategyExposure: Record<PlatoonStrategy, number> = {
  [PlatoonStrategy.AGGRESSIVE]: 1.08,
  [PlatoonStrategy.DEFENSIVE]: 0.95,
  [PlatoonStrategy.PATROL]: 1,
  [PlatoonStrategy.CAUTIOUS]: 0.82,
};

export const strategyInfo: Record<PlatoonStrategy, StrategyInfo> = {
  [PlatoonStrategy.AGGRESSIVE]: {
    strategy: PlatoonStrategy.AGGRESSIVE,
    label: "Aggressive",
    summary: "Close with the enemy and take ground fast.",
    pros: ["Moves 10% faster", "Closes to decisive range", "Captures quickly"],
    cons: ["8% easier to hit while pushing", "Walks into fire", "Ignores cover on the move"],
  },
  [PlatoonStrategy.DEFENSIVE]: {
    strategy: PlatoonStrategy.DEFENSIVE,
    label: "Defensive",
    summary: "Hold what you have and make them come to you.",
    pros: ["Digs into the best nearby cover", "Engages at maximum range", "Slightly harder to hit"],
    cons: ["Cedes the initiative", "Slow to take new ground", "Can be fixed in place and flanked"],
  },
  [PlatoonStrategy.PATROL]: {
    strategy: PlatoonStrategy.PATROL,
    label: "Patrol",
    summary: "Walk the ground and react to contact.",
    pros: ["Covers ground steadily", "Whole element turns on a contact report", "Balanced exposure"],
    cons: ["Second-hand contacts arrive on a delay", "Neither fast nor dug in"],
  },
  [PlatoonStrategy.CAUTIOUS]: {
    strategy: PlatoonStrategy.CAUTIOUS,
    label: "Cautious",
    summary: "Bound from cover to cover and shoot from distance.",
    pros: ["18% harder to hit", "Moves through cover en route", "Opens fire at long standoff"],
    cons: ["20% slower everywhere", "Slow to capture", "Can be outpaced and cut off"],
  },
};


/**
 * What an element collectively knows about contact.
 *
 * `unaware` — nobody has seen anything.
 * `reporting` — someone is in contact, but the word has not gone round yet.
 * `alerted` — the whole element knows and is acting on it.
 */
export type AlertState = "unaware" | "reporting" | "alerted";

/**
 * Simulated seconds between one unit making contact and the rest of its
 * element acting on it. A unit that can see the enemy itself reacts at once —
 * this delay is the cost of second-hand knowledge, not of noticing.
 */
export const CONTACT_REPORT_DELAY_SECONDS = 22;

/** Quiet for this long and the element stands down again. */
export const ALERT_STAND_DOWN_SECONDS = 90;
