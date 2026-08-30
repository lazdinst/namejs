import { Mos, SoldierCard } from "./mos";
import { Loadout, validateLoadout, LoadoutProblem } from "./loadout";
import { PlatoonFaction } from "./platoon";
import { PlatoonStrategy } from "./platoon";

/** One picked soldier and what the player kitted him with. */
export interface ElementSlot {
  soldier: SoldierCard;
  loadout: Loadout;
}

/**
 * What a player builds and drops in: a small SF element, a faction to fight
 * for, a posture, and a landing zone to arrive at.
 */
export interface ElementBuild {
  name: string;
  faction: PlatoonFaction;
  strategy: PlatoonStrategy;
  landingZoneId: string;
  slots: ElementSlot[];
}

/** A detachment is twelve men; a split team is six. Keep it in that band. */
export const ELEMENT_MIN_SIZE = 4;
export const ELEMENT_MAX_SIZE = 8;

/** Composition rules an element has to satisfy before it can drop. */
export interface ElementProblem {
  slot: number | null;
  message: string;
}

/**
 * Everything wrong with a build. Composition rules encode what a real team
 * looks like: someone has to lead it, and someone has to keep it alive.
 */
export function validateElement(build: ElementBuild): ElementProblem[] {
  const problems: ElementProblem[] = [];
  const { slots } = build;

  if (!build.name.trim()) {
    problems.push({ slot: null, message: "The element needs a name" });
  }

  if (slots.length < ELEMENT_MIN_SIZE) {
    problems.push({
      slot: null,
      message: `An element needs at least ${ELEMENT_MIN_SIZE} men`,
    });
  }
  if (slots.length > ELEMENT_MAX_SIZE) {
    problems.push({
      slot: null,
      message: `An element cannot be more than ${ELEMENT_MAX_SIZE} men`,
    });
  }

  const count = (mos: Mos) => slots.filter((s) => s.soldier.mos === mos).length;

  const leaders = count(Mos.A18) + count(Mos.Z18);
  if (leaders === 0) {
    problems.push({ slot: null, message: "Someone has to lead: pick an 18A or 18Z" });
  }
  if (count(Mos.A18) > 1) {
    problems.push({ slot: null, message: "Only one detachment commander" });
  }
  if (count(Mos.D18) === 0) {
    problems.push({ slot: null, message: "No medic: casualties will bleed out. Pick an 18D" });
  }

  const ids = new Set<string>();
  slots.forEach((slot, index) => {
    if (ids.has(slot.soldier.id)) {
      problems.push({ slot: index, message: `${slot.soldier.callsign} is already in the element` });
    }
    ids.add(slot.soldier.id);

    for (const problem of validateLoadout(slot.soldier.mos, slot.loadout)) {
      problems.push({ slot: index, message: `${slot.soldier.callsign}: ${problem.message}` });
    }
  });

  return problems;
}

export const isElementValid = (build: ElementBuild) =>
  validateElement(build).length === 0;

export type { LoadoutProblem };
