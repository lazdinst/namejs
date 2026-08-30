import { Unit, ShotResult } from "./Unit";
import {
  PlatoonFaction,
  PlatoonStrategy,
  AlertState,
  Coordinate,
} from "shared";

export interface VolleyShot {
  attacker: Unit;
  target: Unit;
  shot: ShotResult;
}

export class Platoon {
  public id: string;
  public strategy: PlatoonStrategy;
  public faction: PlatoonFaction;
  public units: Unit[];
  /** What the player called it. Defaults to the id. */
  public name: string;
  /** What the element as a whole knows about contact. */
  public alertState: AlertState = "unaware";
  /** Simulated seconds until a pending contact report reaches everyone. */
  public reportDelay = 0;
  /** Where contact was last reported, which is where the element heads. */
  public lastContact: Coordinate | null = null;
  /** Simulated seconds since anyone in the element had contact. */
  public quietFor = 0;
  /** The objective this element is currently working toward. */
  public assignedObjectiveId: string | null = null;

  constructor(
    id: string,
    faction: PlatoonFaction,
    strategy: PlatoonStrategy,
    units: Unit[]
  ) {
    this.id = id;
    this.strategy = strategy;
    this.faction = faction;
    this.units = units;
    this.name = id;
  }

  public livingUnits(): Unit[] {
    return this.units.filter((unit) => unit.isAlive());
  }

  public isEliminated(): boolean {
    return this.livingUnits().length === 0;
  }

  /** Alive, on their feet, and still willing to fight. */
  public effectiveUnits(): Unit[] {
    return this.units.filter((unit) => unit.isEffective() && !unit.isBroken());
  }

  /**
   * An element stops being a fighting force long before the last man falls.
   * Once it is down to a third of its strength it has lost the engagement,
   * whether or not anyone is left standing — which is what lets a battle be
   * decided by a rout instead of by annihilation.
   */
  public isCombatEffective(): boolean {
    if (this.units.length === 0) return false;
    return this.effectiveUnits().length / this.units.length >= 1 / 3;
  }

  /**
   * One shot from every unit that has a living enemy inside its effective
   * range. Cooldowns are ignored — this is the manual, out-of-loop volley
   * behind POST /api/game/attack.
   */
  public volleyAgainst(
    targetPlatoon: Platoon,
    random: () => number
  ): VolleyShot[] {
    const shots: VolleyShot[] = [];

    for (const attacker of this.livingUnits()) {
      const target = this.closestEngageableTarget(attacker, targetPlatoon);
      if (!target) continue;

      shots.push({ attacker, target, shot: attacker.fireAt(target, random) });
    }

    return shots;
  }

  private closestEngageableTarget(
    attacker: Unit,
    targetPlatoon: Platoon
  ): Unit | null {
    const range = attacker.effectiveRange();

    return (
      targetPlatoon
        .livingUnits()
        .map((unit) => ({ unit, meters: attacker.distanceTo(unit) }))
        .filter(({ meters }) => meters <= range)
        .sort((a, b) => a.meters - b.meters)[0]?.unit ?? null
    );
  }
}
