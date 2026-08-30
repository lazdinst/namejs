import {
  GameStatus,
  UnitStatusType,
  PlatoonStrategy,
  Coordinate,
  bestCoverNear,
  coverRank,
  destinationPoint,
  distanceMeters,
  moveTowards,
  Role,
  SUPPRESSION_PER_HIT,
  SUPPRESSION_PER_NEAR_MISS,
  SUPPRESSION_SPLASH_METERS,
  SUPPRESSION_SPLASH_FACTOR,
  MORALE_FRIENDLY_KIA,
  MORALE_KIA_RADIUS_METERS,
  MORALE_LEADER_KIA,
  MORALE_LEADER_RALLY_BONUS,
  MORALE_LEADER_RADIUS_METERS,
  CONTACT_REPORT_DELAY_SECONDS,
  ALERT_STAND_DOWN_SECONDS,
  TREAT_SECONDS,
  TREAT_RANGE_METERS,
  TRANSFUSION_PER_SECOND,
  AWAIT_TREATMENT_RADIUS_METERS,
  ObjectiveType,
  LandingZoneType,
  PlatoonFaction,
  captureRate,
  holdsAll,
  tallyHeld,
  emptyPresence,
  CAPTURE_DECAY_PER_SECOND,
  CAPTURE_MIN_UNITS,
  ElementBuild,
  validateElement,
  SoldierCard,
  FlightType,
  strategySpeed,
  strategyStandoff,
  strategyExposure,
} from "shared";
import { CommandType, GameEventType } from "../types/game";
import {
  initialPlatoons,
  initialObjectives,
  initialLandingZones,
} from "../config/gameConfig";
import { Platoon } from "./Platoon";
import { Unit } from "./Unit";
import { applyCommand, CommandResult } from "./commands";
import { Flight } from "./Flight";
import { buildPlatoon, draftBoard } from "./deployment";

export { GameStatus };

/** Simulation rate. Every tick advances the world by one fixed step. */
export const TICK_HZ = 10;
export const TICK_INTERVAL_MS = 1000 / TICK_HZ;

/** Broadcast on every Nth tick, so the wire runs at 5 Hz while the sim runs at 10. */
export const BROADCAST_EVERY_N_TICKS = 2;

/**
 * Simulated seconds per real second. Infantry move at 1–2 m/s, so at 1× an
 * approach march is not something you can watch. This is a clock multiplier,
 * not a speed fudge — every duration in the sim, including weapon cooldowns,
 * scales together.
 */
export const DEFAULT_TIME_SCALE = 20;

/** How many engagement events to retain for the client feed. */
export const EVENT_LOG_LIMIT = 60;

/**
 * Units advance until they are this far inside their effective range, then
 * hold and shoot rather than walking into the enemy.
 */
export const STANDOFF_FRACTION = 0.7;

/** How far a unit will move off its anchor to find better cover. */
export const COVER_SEARCH_METERS = 70;

/** Only move for cover that is genuinely better and genuinely elsewhere. */
export const COVER_MIN_GAIN_METERS = 8;

/** Length of a patrol leg, walked out and back from the anchor. */
export const PATROL_LEG_METERS = 120;

export type GameListener = (game: Game) => void;

export interface GameOutcome {
  winnerId: string;
  loserId: string;
  reason: "destroyed" | "combat-ineffective" | "objectives";
  tick: number;
}

/** What a unit knows about the world this tick. Built fresh each time. */
export interface Perception {
  unit: Unit;
  platoon: Platoon;
  enemies: { unit: Unit; meters: number }[];
  nearestEnemy: Unit | null;
  nearestEnemyMeters: number;
}

export class Game {
  private status: GameStatus;
  private platoons: Platoon[];
  private commandQueue: CommandType[] = [];
  private listeners = new Set<GameListener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private tickCount = 0;
  private timeScale: number;
  private events: GameEventType[] = [];
  private reportedDry = new Set<string>();
  /** Units that took fire this tick, cleared at the start of each one. */
  private underFire = new Set<string>();
  /** Morale states already reported, so a break is logged once, not per tick. */
  private reportedMorale = new Map<string, string>();
  private random: () => number;
  /**
   * Admin/observer mode. When on, both sides act on their own strategy so a
   * single operator can start the simulation and watch it play out. Operator
   * orders still override autonomous intent for the unit they name.
   */
  private autonomous = true;
  private outcome: GameOutcome | null = null;
  private objectives: ObjectiveType[] = initialObjectives();
  private readonly landingZones: LandingZoneType[] = initialLandingZones();
  /** Elements in the air, not yet on the ground. */
  private flights: Flight[] = [];
  private flightCounter = 0;
  /** The draft board every player picks from this session. */
  private roster: SoldierCard[];

  constructor(
    timeScale: number = DEFAULT_TIME_SCALE,
    random: () => number = Math.random
  ) {
    this.status = GameStatus.NOT_STARTED;
    this.platoons = initialPlatoons();
    this.timeScale = timeScale;
    this.random = random;
    this.roster = draftBoard(random);
  }

  // ---------------------------------------------------------------- lifecycle

  public start(): string {
    if (this.status === GameStatus.RUNNING) {
      return "Game is already running.";
    }

    this.status = GameStatus.RUNNING;
    this.startTimer();
    return "Game started successfully.";
  }

  public pause(): string {
    if (this.status !== GameStatus.RUNNING) {
      return "Game is not running.";
    }

    this.status = GameStatus.PAUSED;
    this.stopTimer();
    return "Game paused successfully.";
  }

  public reset(): string {
    this.stopTimer();
    this.status = GameStatus.NOT_STARTED;
    this.platoons = initialPlatoons();
    this.objectives = initialObjectives();
    this.flights = [];
    this.flightCounter = 0;
    this.roster = draftBoard(this.random);
    this.commandQueue = [];
    this.events = [];
    this.reportedDry.clear();
    this.underFire.clear();
    this.reportedMorale.clear();
    this.outcome = null;
    this.tickCount = 0;
    this.emit();
    return "Game reset successfully.";
  }

  private startTimer(): void {
    if (this.timer) return;

    this.timer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
    // Don't hold the process open on this timer alone.
    this.timer.unref?.();
  }

  private stopTimer(): void {
    if (!this.timer) return;

    clearInterval(this.timer);
    this.timer = null;
  }

  /** True while the interval is live. Exposed for tests and diagnostics. */
  public isTicking(): boolean {
    return this.timer !== null;
  }

  // ------------------------------------------------------------------- clock

  public getTickCount(): number {
    return this.tickCount;
  }

  public getTimeScale(): number {
    return this.timeScale;
  }

  public setTimeScale(scale: number): void {
    if (!Number.isFinite(scale) || scale <= 0) return;
    this.timeScale = scale;
  }

  /** Simulated seconds advanced per tick. */
  public secondsPerTick(): number {
    return (TICK_INTERVAL_MS / 1000) * this.timeScale;
  }

  /**
   * Advance the world exactly one tick. Driven by the interval while running,
   * and callable directly for deterministic stepping in tests.
   */
  public tick(): void {
    this.drainCommands();
    this.update(this.secondsPerTick());

    this.tickCount += 1;

    if (this.tickCount % BROADCAST_EVERY_N_TICKS === 0) {
      this.emit();
    }
  }

  // -------------------------------------------------------------- simulation

  /**
   * One simulation step, in four stages. Defending and healing each have a
   * designated stage to land in as they arrive, so no phase has to reorganise
   * the loop.
   */
  public update(seconds: number): void {
    this.underFire.clear();
    this.flyInbound(seconds);

    const perceptions = this.perceive();
    this.decide(perceptions);
    this.act(perceptions, seconds);
    this.resolve(perceptions, seconds);
  }

  /** Stage 1 — what each living unit can observe, nearest enemy first. */
  private perceive(): Perception[] {
    const living = this.platoons.flatMap((platoon) =>
      platoon.units
        .filter((unit) => unit.isAlive())
        .map((unit) => ({ unit, platoon }))
    );

    return living.map(({ unit, platoon }) => {
      const enemies = living
        // A man on the ground is a casualty, not a threat. Leaving them in the
        // target list is what turned every rout into a massacre.
        .filter(
          (other) =>
            other.platoon.faction !== platoon.faction &&
            other.unit.isEffective()
        )
        .map((other) => ({
          unit: other.unit,
          meters: unit.distanceTo(other.unit),
        }))
        .sort((a, b) => a.meters - b.meters);

      return {
        unit,
        platoon,
        enemies,
        nearestEnemy: enemies[0]?.unit ?? null,
        nearestEnemyMeters: enemies[0]?.meters ?? Infinity,
      };
    });
  }

  /**
   * Stage 2 — turn perception into intent: who to shoot, and where to be.
   *
   * Target selection always runs. Movement only runs in autonomous mode, and
   * never for a unit currently following an operator order.
   */
  private decide(perceptions: Perception[]): void {
    this.assignObjectives();

    // Who a medic is already on their way to. Derived up front rather than set
    // as medics are visited, so it does not depend on iteration order.
    const awaitingTreatment = this.casualtiesExpectingHelp(perceptions);

    for (const perception of perceptions) {
      const { unit } = perception;

      // The element's posture rides on every man in it.
      unit.postureSpeed = strategySpeed[perception.platoon.strategy];
      unit.postureExposure = strategyExposure[perception.platoon.strategy];

      const range = unit.effectiveRange();
      const target = perception.enemies.find((enemy) => enemy.meters <= range);
      unit.targetId = target ? target.unit.id : null;

      // A broken unit stops shooting at anything that is not on top of it.
      if (unit.isBroken() && perception.nearestEnemyMeters > range * 0.35) {
        unit.targetId = null;
      }

      if (!this.autonomous || unit.hasOrders) continue;

      // Help on the way outranks everything: a casualty holds still so the
      // medic can close, or the two of them chase each other across the map.
      unit.underTreatment = awaitingTreatment.has(unit.id);
      if (unit.underTreatment) {
        unit.steer(null);
        continue;
      }

      // State overrides intent: nerve first, then orders.
      if (unit.isBroken()) {
        this.withdraw(perception);
        continue;
      }

      if (unit.isPinned()) {
        // Held down. Cannot advance, but stays where it is and returns fire.
        unit.steer(null);
        continue;
      }

      // A medic's job outranks the platoon's plan.
      if (unit.role === Role.Medic && this.tendCasualties(perception, perceptions)) {
        continue;
      }

      if (unit.isShaken()) {
        // Will hold and use cover, but will not press an attack.
        this.holdAndTakeCover(perception);
        continue;
      }

      switch (perception.platoon.strategy) {
        case PlatoonStrategy.AGGRESSIVE:
          // Fight what is in front of you; otherwise go take the ground.
          if (perception.nearestEnemyMeters <= this.detectionRange(perception)) {
            this.advanceToContact(perception);
          } else {
            this.pursueObjective(perception);
          }
          break;
        case PlatoonStrategy.DEFENSIVE:
          if (this.holdingAssignedObjective(perception)) {
            this.holdAndTakeCover(perception);
          } else {
            this.pursueObjective(perception);
          }
          break;
        case PlatoonStrategy.PATROL:
          this.patrol(perception);
          break;
        case PlatoonStrategy.CAUTIOUS:
          this.boundCautiously(perception);
          break;
      }
    }
  }

  /**
   * Cautious movement: the same destinations as everyone else, reached by
   * bounding through whatever cover lies along the way rather than walking
   * the straight line.
   */
  private boundCautiously(perception: Perception): void {
    const { unit, nearestEnemyMeters } = perception;

    if (nearestEnemyMeters <= this.detectionRange(perception)) {
      this.advanceToContact(perception);
      return;
    }

    const objective = this.assignedObjective(perception);
    if (!objective || this.holdingAssignedObjective(perception)) {
      this.holdAndTakeCover(perception);
      return;
    }

    // Look for cover partway along the leg; take it if it beats what we have.
    const legMeters = Math.min(
      80,
      distanceMeters(unit.position, objective.position)
    );
    const toward = moveTowards(unit.position, objective.position, legMeters);
    const candidate = bestCoverNear(toward, 45);

    unit.steer(
      candidate.rank > coverRank[unit.cover]
        ? candidate.position
        : ([objective.position[0], objective.position[1]] as Coordinate)
    );
  }

  /** Casualties a medic has claimed and is close enough to reach. */
  private casualtiesExpectingHelp(perceptions: Perception[]): Set<string> {
    const waiting = new Set<string>();

    for (const { unit } of perceptions) {
      if (unit.role !== Role.Medic || !unit.patient) continue;

      const patient = this.findUnit(unit.patient);
      if (!patient || !patient.isAlive()) continue;
      if (unit.distanceTo(patient) > AWAIT_TREATMENT_RADIUS_METERS) continue;

      waiting.add(patient.id);
    }

    return waiting;
  }

  /**
   * Move to the most urgent casualty in the element and work on them.
   * Returns true when the medic has taken the job, so nothing else steers it.
   */
  private tendCasualties(
    medic: Perception,
    perceptions: Perception[]
  ): boolean {
    const casualty = this.mostUrgentCasualty(medic, perceptions);
    if (!casualty) {
      medic.unit.patient = null;
      return false;
    }

    medic.unit.patient = casualty.id;
    const meters = medic.unit.distanceTo(casualty);

    if (meters > TREAT_RANGE_METERS) {
      medic.unit.steer([casualty.position[0], casualty.position[1]] as Coordinate);
      return true;
    }

    medic.unit.steer(null);
    return true;
  }

  /**
   * Worst first: whoever is closest to bleeding out, then whoever is bleeding
   * at all, weighted against how far the medic has to run.
   */
  private mostUrgentCasualty(
    medic: Perception,
    perceptions: Perception[]
  ): Unit | null {
    let best: Unit | null = null;
    let bestScore = -Infinity;

    for (const { unit, platoon } of perceptions) {
      if (platoon.faction !== medic.platoon.faction) continue;
      if (unit === medic.unit || !unit.isAlive()) continue;
      if (!unit.incapacitated && !unit.isBleeding()) continue;

      const meters = medic.unit.distanceTo(unit);
      if (meters > 400) continue;

      const urgency =
        (unit.incapacitated ? 100 : 0) +
        unit.vitals.shockIndex * 20 +
        unit.bleedRate() * 4000 -
        meters * 0.15;

      if (urgency > bestScore) {
        bestScore = urgency;
        best = unit;
      }
    }

    return best;
  }

  /** Fall back to the rally point and stop fighting. */
  private withdraw(perception: Perception): void {
    const { unit } = perception;

    if (distanceMeters(unit.position, unit.spawnPosition) <= 3) {
      unit.steer(null);
      return;
    }

    unit.steer([unit.spawnPosition[0], unit.spawnPosition[1]] as Coordinate);
  }

  // -------------------------------------------------------- objective drive

  /**
   * Each element works on the nearest objective it does not already hold.
   * Once it holds everything it can reach, it goes to whichever of its own is
   * under the most pressure.
   */
  private assignObjectives(): void {
    if (this.objectives.length === 0) return;

    for (const platoon of this.platoons) {
      const anchor =
        platoon.effectiveUnits()[0]?.position ??
        platoon.units[0]?.spawnPosition;
      if (!anchor) continue;

      const wanted = this.objectives.filter(
        (objective) => objective.holder !== platoon.faction
      );

      const pool = wanted.length > 0 ? wanted : this.objectives;

      const nearest = pool
        .map((objective) => ({
          objective,
          meters: distanceMeters(anchor, objective.position),
          pressure: objective.contested ? 1 : 0,
        }))
        .sort(
          (a, b) => b.pressure - a.pressure || a.meters - b.meters
        )[0];

      platoon.assignedObjectiveId = nearest?.objective.id ?? null;
    }
  }

  private assignedObjective(perception: Perception): ObjectiveType | null {
    const id = perception.platoon.assignedObjectiveId;
    return this.objectives.find((objective) => objective.id === id) ?? null;
  }

  /** Already standing on the ground this element was sent to take. */
  private holdingAssignedObjective(perception: Perception): boolean {
    const objective = this.assignedObjective(perception);
    if (!objective) return false;

    return (
      distanceMeters(perception.unit.position, objective.position) <=
      objective.radiusMeters
    );
  }

  /**
   * Move onto the assigned objective. Units stop once inside the radius so
   * they spread across the ground rather than stacking on the centre point.
   */
  private pursueObjective(perception: Perception): void {
    const objective = this.assignedObjective(perception);
    if (!objective) {
      perception.unit.steer(null);
      return;
    }

    if (this.holdingAssignedObjective(perception)) {
      perception.unit.steer(null);
      return;
    }

    perception.unit.steer([
      objective.position[0],
      objective.position[1],
    ] as Coordinate);
  }

  /** True while any opposing element is still a fighting force. */
  private enemyStillFighting(perception: Perception): boolean {
    return this.platoons.some(
      (platoon) =>
        platoon.faction !== perception.platoon.faction &&
        platoon.isCombatEffective()
    );
  }

  /** How far a unit notices an enemy, as opposed to how far it can hit one. */
  private detectionRange(perception: Perception): number {
    return Math.max(perception.unit.effectiveRange() * 1.5, 500);
  }

  /** Close on the nearest enemy until comfortably in range, then hold. */
  private advanceToContact(perception: Perception): void {
    const { unit, nearestEnemy, nearestEnemyMeters } = perception;

    if (!nearestEnemy) {
      unit.steer(null);
      return;
    }

    // Once the other side is beaten, hold the ground rather than chasing
    // broken men across the map. Pursuit is what turned every rout into a
    // massacre and made annihilation the only outcome.
    if (!this.enemyStillFighting(perception)) {
      unit.steer(null);
      return;
    }

    const standoff =
      unit.effectiveRange() * strategyStandoff[perception.platoon.strategy];

    if (nearestEnemyMeters > standoff) {
      unit.steer([...nearestEnemy.position] as Coordinate);
    } else {
      unit.steer(null);
    }
  }

  /** Hold the anchor, but move the short distance to better cover. */
  private holdAndTakeCover(perception: Perception): void {
    const { unit } = perception;

    if (coverRank[unit.cover] >= coverRank.high) {
      unit.steer(null);
      return;
    }

    const best = bestCoverNear(unit.spawnPosition, COVER_SEARCH_METERS);

    const worthMoving =
      best.rank > coverRank[unit.cover] &&
      distanceMeters(unit.position, best.position) > COVER_MIN_GAIN_METERS;

    unit.steer(worthMoving ? best.position : null);
  }

  /** Walk a leg out and back, and break off to engage on contact. */
  private patrol(perception: Perception): void {
    const { unit, platoon, nearestEnemyMeters } = perception;

    // Seeing the enemy yourself needs no radio.
    if (nearestEnemyMeters <= this.detectionRange(perception)) {
      this.advanceToContact(perception);
      return;
    }

    // Otherwise the element moves once the contact report has gone round.
    if (platoon.alertState === "alerted" && platoon.lastContact) {
      unit.steer([platoon.lastContact[0], platoon.lastContact[1]] as Coordinate);
      return;
    }

    // No contact and ground still to take — go and take it.
    if (!this.holdingAssignedObjective(perception)) {
      this.pursueObjective(perception);
      return;
    }

    const outbound = destinationPoint(
      unit.spawnPosition,
      Math.PI / 2,
      PATROL_LEG_METERS
    );
    const leg = unit.patrolOutbound ? outbound : unit.spawnPosition;

    if (distanceMeters(unit.position, leg) <= 2) {
      unit.patrolOutbound = !unit.patrolOutbound;
      return;
    }

    unit.steer([leg[0], leg[1]] as Coordinate);
  }

  // ------------------------------------------------------------- admin mode

  public isAutonomous(): boolean {
    return this.autonomous;
  }

  /** Turn autonomy on or off. Off leaves every unit under operator control. */
  public setAutonomous(on: boolean): string {
    this.autonomous = on;

    if (!on) {
      for (const platoon of this.platoons) {
        for (const unit of platoon.units) {
          if (!unit.hasOrders) unit.steer(null);
        }
      }
    }

    return `Autonomy ${on ? "enabled" : "disabled"}.`;
  }

  /** Stage 3 — carry out intent: move, then fire from the new positions. */
  private act(perceptions: Perception[], seconds: number): void {
    for (const { unit } of perceptions) {
      unit.advance(seconds);
      unit.serviceWeapon(seconds);
      unit.bleed(seconds);
    }

    this.treatCasualties(perceptions, seconds);

    // Firing is resolved after all movement so range checks use this tick's
    // positions rather than last tick's.
    for (const { unit, platoon } of perceptions) {
      if (!unit.targetId) continue;

      // Report the moment a unit is spent, once, rather than every tick.
      if (unit.isOutOfAmmo()) {
        if (!this.reportedDry.has(unit.id)) {
          this.reportedDry.add(unit.id);
          this.log("dry", `${unit.id} (${platoon.id}) is out of ammunition`);
        }
        continue;
      }

      if (!unit.canFire()) continue;

      const target = this.findUnit(unit.targetId);
      if (!target || !target.isAlive()) continue;
      if (unit.distanceTo(target) > unit.effectiveRange()) continue;

      const burst = unit.fireBurst(target, seconds, this.random, this.tickCount);
      if (burst.length === 0) continue;

      // Rounds press the target down whether or not they connect, and unsettle
      // whoever is near them. This is what makes volume of fire matter.
      for (const shot of burst) {
        this.applySuppression(
          target,
          shot.hit ? SUPPRESSION_PER_HIT : SUPPRESSION_PER_NEAR_MISS,
          perceptions
        );
      }

      const hits = burst.filter((shot) => shot.hit);
      if (hits.length === 0) continue;

      const kill = hits.find((shot) => shot.killed);
      if (kill) {
        this.creditKill(unit, target);
        this.applyCasualtyShock(target, perceptions);
        continue;
      }

      // One line per burst rather than per round, or the feed becomes noise.
      const damage = hits.reduce((sum, shot) => sum + shot.damage, 0);
      const absorbed = hits.reduce((sum, shot) => sum + shot.absorbed, 0);
      const inCover =
        absorbed > 0
          ? `, ${Math.round(absorbed)} stopped by ${hits[0].cover} cover`
          : "";

      this.log(
        "hit",
        `${unit.id} hit ${target.id} ${hits.length}x for ${Math.round(
          damage
        )} at ${Math.round(hits[0].meters)} m${inCover}`
      );
    }
  }

  /**
   * Medics working on their patients. Dressing a wound takes real time, so a
   * medic is out of the fight while doing it — and so is the casualty.
   */
  private treatCasualties(perceptions: Perception[], seconds: number): void {
    for (const { unit: medic, platoon } of perceptions) {
      if (medic.role !== Role.Medic || !medic.isEffective()) continue;
      if (!medic.patient) continue;

      const patient = this.findUnit(medic.patient);
      if (!patient || !patient.isAlive()) {
        medic.patient = null;
        medic.treatRemaining = 0;
        continue;
      }

      if (medic.distanceTo(patient) > TREAT_RANGE_METERS) {
        medic.treatRemaining = 0;
        continue;
      }

      medic.status = UnitStatusType.Treating;
      patient.underTreatment = true;
      patient.steer(null);

      // Volume goes back in throughout, but a bleed only closes when the
      // dressing is finished — a half-applied tourniquet does nothing.
      if (patient.bloodVolume < 1) {
        patient.transfuse(TRANSFUSION_PER_SECOND * seconds);
      }

      if (!patient.isBleeding()) {
        medic.treatRemaining = 0;
        continue;
      }

      if (medic.treatRemaining <= 0) {
        const worst = patient.bleeds.includes("heavy") ? "heavy" : "light";
        medic.treatRemaining = TREAT_SECONDS[worst];
      }

      medic.treatRemaining -= seconds;

      if (medic.treatRemaining <= 0) {
        const treated = patient.dressWound();
        const supplies = medic.inventory.medicalSupplies;

        if (treated === "heavy" && supplies.heavyBleedingBandages > 0) {
          supplies.heavyBleedingBandages -= 1;
        } else if (treated === "light" && supplies.lightBleedingBandages > 0) {
          supplies.lightBleedingBandages -= 1;
        }

        this.log(
          "medical",
          `${medic.id} dressed a ${treated} bleed on ${patient.id} (${platoon.id})`
        );
      }
    }
  }

  /**
   * Book a kill against whoever finished it, and an assist against everyone
   * who did real damage without landing the last round.
   */
  private creditKill(killer: Unit, victim: Unit): void {
    killer.kills.push(victim.id);

    const assists = victim.assistedBy();
    for (const id of assists) {
      const helper = this.findUnit(id);
      if (helper) helper.assists.push(victim.id);
    }

    const credit =
      assists.length > 0 ? `, assisted by ${assists.join(", ")}` : "";

    this.log("kia", `${killer.id} killed ${victim.id}${credit}`);
  }

  /** Press a unit down, and splash a fraction onto the friends beside it. */
  private applySuppression(
    target: Unit,
    amount: number,
    perceptions: Perception[]
  ): void {
    target.suppress(amount);
    this.underFire.add(target.id);

    const targetFaction = this.factionOf(target, perceptions);
    if (!targetFaction) return;

    for (const { unit: other, platoon } of perceptions) {
      if (other === target || platoon.faction !== targetFaction) continue;
      if (target.distanceTo(other) > SUPPRESSION_SPLASH_METERS) continue;

      other.suppress(amount * SUPPRESSION_SPLASH_FACTOR);
      this.underFire.add(other.id);
    }
  }

  /**
   * Watching someone die nearby costs everyone's nerve, and losing the squad
   * leader costs the whole platoon its steadying influence.
   */
  private applyCasualtyShock(
    casualty: Unit,
    perceptions: Perception[]
  ): void {
    const faction = this.factionOf(casualty, perceptions);

    for (const platoon of this.platoons) {
      const leaderLoss =
        casualty.role === Role.SquadLeader &&
        platoon.units.includes(casualty);

      for (const unit of platoon.units) {
        if (unit === casualty || !unit.isAlive()) continue;

        if (leaderLoss) unit.drainMorale(MORALE_LEADER_KIA);

        if (
          platoon.faction === faction &&
          casualty.distanceTo(unit) <= MORALE_KIA_RADIUS_METERS
        ) {
          unit.drainMorale(MORALE_FRIENDLY_KIA);
        }
      }
    }
  }

  private factionOf(unit: Unit, perceptions: Perception[]) {
    return perceptions.find((p) => p.unit === unit)?.platoon.faction ?? null;
  }

  /**
   * Stage 4 — settle derived state after everyone has acted: bleed off
   * suppression, recover or lose nerve, and set the activity each unit's
   * state actually amounts to.
   */
  private resolve(perceptions: Perception[], seconds: number): void {
    for (const platoon of this.platoons) {
      // A living squad leader steadies the men around them.
      const leader = platoon.units.find(
        (unit) => unit.role === Role.SquadLeader && unit.isAlive()
      );

      for (const unit of platoon.units) {
        if (!unit.isAlive()) {
          unit.destination = null;
          unit.targetId = null;
          continue;
        }

        unit.settleNerves(seconds, this.underFire.has(unit.id));

        if (
          leader &&
          leader !== unit &&
          !this.underFire.has(unit.id) &&
          leader.distanceTo(unit) <= MORALE_LEADER_RADIUS_METERS
        ) {
          unit.rally(seconds, MORALE_LEADER_RALLY_BONUS - 1);
        }

        this.settleStatus(unit);
        this.reportMorale(unit, platoon);
      }
    }

    this.passContactReports(perceptions, seconds);
    this.updateObjectives(perceptions, seconds);
    this.checkOutcome();
  }

  // -------------------------------------------------------------- deployment

  public getRoster(): SoldierCard[] {
    return this.roster;
  }

  public getFlights(): FlightType[] {
    return this.flights.map((flight) => flight.toJSON());
  }

  /**
   * A player drops in. The build is validated, the element is put aboard a
   * helicopter, and nothing touches the ground until the flight arrives.
   */
  public deploy(build: ElementBuild): CommandResult & { flightId?: string } {
    const problems = validateElement(build);
    if (problems.length > 0) {
      return { ok: false, message: problems.map((p) => p.message).join("; ") };
    }

    const landingZone = this.landingZones.find(
      (lz) => lz.id === build.landingZoneId
    );
    if (!landingZone) {
      return { ok: false, message: `No landing zone ${build.landingZoneId}` };
    }

    // Every soldier on the board can be picked once, by one player.
    const taken = new Set(
      [...this.platoons, ...this.flights.map((f) => f.cargo)]
        .flatMap((p) => p.units)
        .map((u) => u.callsign)
    );
    for (const slot of build.slots) {
      if (taken.has(slot.soldier.callsign)) {
        return {
          ok: false,
          message: `${slot.soldier.callsign} has already been deployed`,
        };
      }
    }

    this.flightCounter += 1;
    const platoonId = `${build.faction}-${this.flightCounter + 1}`;
    const platoon = buildPlatoon(platoonId, build, landingZone);
    const flight = new Flight(
      `flight-${this.flightCounter}`,
      platoon,
      landingZone.id,
      landingZone.position
    );

    this.flights.push(flight);
    this.log(
      "comms",
      `${flight.callsign} inbound to ${landingZone.name} with ${platoon.name}, ${platoon.units.length} aboard`
    );
    this.emit();

    return {
      ok: true,
      message: `${platoon.name} inbound to ${landingZone.name}`,
      flightId: flight.id,
    };
  }

  /** Move every flight, and put down the ones that have arrived. */
  private flyInbound(seconds: number): void {
    const landed: Flight[] = [];

    for (const flight of this.flights) {
      if (flight.advance(seconds)) landed.push(flight);
    }

    for (const flight of landed) {
      this.flights = this.flights.filter((f) => f !== flight);
      this.platoons.push(flight.cargo);

      const lz = this.landingZones.find((l) => l.id === flight.landingZoneId);
      this.log(
        "comms",
        `${flight.cargo.name} on the ground at ${lz?.name ?? flight.landingZoneId}`
      );
    }
  }

  // -------------------------------------------------------------- objectives

  public getObjectives(): ObjectiveType[] {
    return this.objectives;
  }

  /** Remove the seeded platoons — a player match starts with an empty field. */
  public clearPlatoons(): void {
    this.platoons = [];
  }

  /** Strip the map of objectives, so elements act on strategy alone. */
  public clearObjectives(): void {
    this.objectives = [];
    for (const platoon of this.platoons) platoon.assignedObjectiveId = null;
  }

  public getLandingZones(): LandingZoneType[] {
    return this.landingZones;
  }

  /**
   * Ground is taken by standing on it. Presence inside the radius, by enough
   * men, for long enough — and only while the other side is not also there.
   */
  private updateObjectives(
    perceptions: Perception[],
    seconds: number
  ): void {
    for (const objective of this.objectives) {
      const presence = emptyPresence();

      for (const { unit, platoon } of perceptions) {
        // A man on the ground bleeding does not hold ground.
        if (!unit.isEffective()) continue;
        if (distanceMeters(unit.position, objective.position) > objective.radiusMeters) {
          continue;
        }
        presence[platoon.faction] += 1;
      }

      objective.presence = presence;

      const claimants = (
        Object.keys(presence) as PlatoonFaction[]
      ).filter((faction) => presence[faction] >= CAPTURE_MIN_UNITS);

      objective.contested = claimants.length > 1;

      // Both sides on the ground: nobody makes progress.
      if (objective.contested || claimants.length === 0) {
        objective.progress = Math.max(
          0,
          objective.progress - CAPTURE_DECAY_PER_SECOND * seconds
        );
        if (objective.progress === 0) objective.capturingFaction = null;
        continue;
      }

      const faction = claimants[0];

      // Already theirs — nothing to take.
      if (objective.holder === faction) {
        objective.progress = 0;
        objective.capturingFaction = null;
        continue;
      }

      // A new claimant starts from scratch rather than inheriting progress.
      if (objective.capturingFaction !== faction) {
        objective.capturingFaction = faction;
        objective.progress = 0;
      }

      objective.progress = Math.min(
        1,
        objective.progress + captureRate(presence[faction]) * seconds
      );

      if (objective.progress >= 1) {
        const previous = objective.holder;
        objective.holder = faction;
        objective.progress = 0;
        objective.capturingFaction = null;

        this.log(
          "objective",
          previous
            ? `${faction.toUpperCase()} has taken ${objective.name} from ${previous.toUpperCase()}`
            : `${faction.toUpperCase()} has taken ${objective.name}`
        );
      }
    }
  }

  /**
   * An operator order for a whole element: every effective man is sent to a
   * ring around the point so they arrive spread, not stacked.
   */
  public movePlatoon(platoonId: string, position: Coordinate): CommandResult {
    const platoon = this.platoons.find((p) => p.id === platoonId);
    if (!platoon) return { ok: false, message: `No element ${platoonId}.` };

    const movers = platoon.units.filter((u) => u.isEffective());
    if (movers.length === 0) {
      return { ok: false, message: `${platoon.name} has nobody left to move.` };
    }

    movers.forEach((unit, index) => {
      const bearing = (index / movers.length) * Math.PI * 2;
      unit.setDestination(destinationPoint(position, bearing, 14));
    });

    this.log(
      "comms",
      `${platoon.name} ordered to move — ${movers.length} moving`
    );
    return { ok: true, message: `${platoon.name} moving.` };
  }

  /** Change an element's posture. */
  public setPlatoonStrategy(
    platoonId: string,
    strategy: PlatoonStrategy
  ): CommandResult {
    const platoon = this.platoons.find((p) => p.id === platoonId);
    if (!platoon) return { ok: false, message: `No element ${platoonId}.` };
    if (!Object.values(PlatoonStrategy).includes(strategy)) {
      return { ok: false, message: `No such posture: ${strategy}.` };
    }

    platoon.strategy = strategy;
    this.log("comms", `${platoon.name} posture set to ${strategy}`);
    this.emit();
    return { ok: true, message: `${platoon.name} now ${strategy}.` };
  }

  /** Objectives held per faction. */
  public objectiveTally(): Record<PlatoonFaction, number> {
    return tallyHeld(this.objectives);
  }

  /**
   * Word of contact spreading through an element.
   *
   * A unit that can see the enemy itself reacts immediately — that is handled
   * in `patrol`. This models the second-hand case: one man makes contact, and
   * some seconds later the rest of the element knows and turns toward it.
   */
  private passContactReports(
    perceptions: Perception[],
    seconds: number
  ): void {
    for (const platoon of this.platoons) {
      const contact = perceptions.find(
        (p) =>
          p.platoon === platoon &&
          (p.unit.targetId !== null || this.underFire.has(p.unit.id))
      );

      if (contact) {
        platoon.quietFor = 0;
        if (contact.nearestEnemy) {
          platoon.lastContact = [
            contact.nearestEnemy.position[0],
            contact.nearestEnemy.position[1],
          ];
        }

        if (platoon.alertState === "unaware") {
          platoon.alertState = "reporting";
          platoon.reportDelay = CONTACT_REPORT_DELAY_SECONDS;
          this.log(
            "comms",
            `${contact.unit.id} reports contact — ${platoon.id} passing the word`
          );
        }
      } else {
        platoon.quietFor += seconds;

        if (
          platoon.alertState !== "unaware" &&
          platoon.quietFor >= ALERT_STAND_DOWN_SECONDS
        ) {
          platoon.alertState = "unaware";
          platoon.lastContact = null;
          this.log("comms", `${platoon.id} stands down`);
        }
      }

      if (platoon.alertState === "reporting") {
        platoon.reportDelay -= seconds;

        if (platoon.reportDelay <= 0) {
          platoon.alertState = "alerted";
          this.log("comms", `${platoon.id} alerted — moving to contact`);
        }
      }
    }
  }

  /** The activity a unit's nerve and orders add up to this tick. */
  private settleStatus(unit: Unit): void {
    // Bleeding out on the ground outranks everything else.
    if (unit.incapacitated) {
      unit.status = UnitStatusType.Down;
      return;
    }

    // A medic mid-dressing stays on the job.
    if (unit.status === UnitStatusType.Treating && unit.treatRemaining > 0) {
      return;
    }

    if (unit.isBroken()) {
      unit.status = unit.destination
        ? UnitStatusType.Withdrawing
        : UnitStatusType.Idle;
      return;
    }

    if (unit.isPinned()) {
      unit.status = UnitStatusType.Pinned;
      return;
    }

    if (unit.targetId) {
      unit.status = UnitStatusType.Engaged;
      return;
    }

    if (unit.status === UnitStatusType.Engaged) {
      unit.status = unit.destination
        ? UnitStatusType.Moving
        : UnitStatusType.Idle;
      return;
    }

    // A unit that was withdrawing or pinned and is neither any more goes back
    // to doing whatever its destination implies.
    if (
      unit.status === UnitStatusType.Withdrawing ||
      unit.status === UnitStatusType.Pinned
    ) {
      unit.status = unit.destination
        ? UnitStatusType.Moving
        : UnitStatusType.Idle;
    }
  }

  /** Log a unit breaking or rallying, once per transition. */
  private reportMorale(unit: Unit, platoon: Platoon): void {
    const previous = this.reportedMorale.get(unit.id);
    if (previous === unit.moraleState) return;

    this.reportedMorale.set(unit.id, unit.moraleState);
    if (previous === undefined) return;

    if (unit.moraleState === "broken") {
      this.log("morale", `${unit.id} (${platoon.id}) has broken and is falling back`);
    } else if (previous === "broken") {
      this.log("morale", `${unit.id} (${platoon.id}) has rallied`);
    }
  }

  private findUnit(id: string): Unit | undefined {
    return this.platoons
      .flatMap((platoon) => platoon.units)
      .find((unit) => unit.id === id);
  }

  // ------------------------------------------------------------------ events

  private log(type: GameEventType["type"], message: string): void {
    this.events.push({ type, message, tick: this.tickCount });

    if (this.events.length > EVENT_LOG_LIMIT) {
      this.events.splice(0, this.events.length - EVENT_LOG_LIMIT);
    }
  }

  public getEvents(): GameEventType[] {
    return this.events;
  }

  /**
   * Who holds the field. A battle is decided when one side stops being a
   * fighting force, which usually happens well before it stops existing.
   */
  public getOutcome(): GameOutcome | null {
    return this.outcome;
  }

  private checkOutcome(): void {
    if (this.outcome) return;

    // Taking all the ground wins outright, whatever the butcher's bill.
    for (const platoon of this.platoons) {
      if (!holdsAll(this.objectives, platoon.faction)) continue;

      const loser = this.platoons.find((p) => p.faction !== platoon.faction);
      this.outcome = {
        winnerId: platoon.id,
        loserId: loser?.id ?? "",
        reason: "objectives",
        tick: this.tickCount,
      };

      this.log(
        "outcome",
        `${platoon.id} holds all objectives — ${platoon.faction.toUpperCase()} wins`
      );
      return;
    }

    const beaten = this.platoons.filter((p) => !p.isCombatEffective());
    if (beaten.length === 0 || beaten.length === this.platoons.length) return;

    const winner = this.platoons.find((p) => p.isCombatEffective());
    if (!winner) return;

    const loser = beaten[0];
    const wiped = loser.isEliminated();

    this.outcome = {
      winnerId: winner.id,
      loserId: loser.id,
      reason: wiped ? "destroyed" : "combat-ineffective",
      tick: this.tickCount,
    };

    this.log(
      "outcome",
      wiped
        ? `${loser.id} destroyed — ${winner.id} holds the field`
        : `${loser.id} is combat ineffective — ${winner.id} holds the field`
    );
  }

  // ---------------------------------------------------------------- commands

  /** Queue a validated command. Applied at the next tick boundary. */
  public enqueueCommand(command: CommandType): void {
    this.commandQueue.push(command);
  }

  public pendingCommandCount(): number {
    return this.commandQueue.length;
  }

  /**
   * Apply a command immediately, outside the loop. Used by REST routes that
   * need to report success synchronously.
   */
  public applyCommandNow(command: CommandType): CommandResult {
    return applyCommand(command, this.platoons);
  }

  private drainCommands(): void {
    if (this.commandQueue.length === 0) return;

    const queued = this.commandQueue;
    this.commandQueue = [];

    for (const command of queued) {
      const result = applyCommand(command, this.platoons);
      if (!result.ok) {
        console.warn("Rejected command:", result.message);
      }
    }
  }

  // -------------------------------------------------------------- observers

  /** Subscribe to state changes. Returns an unsubscribe function. */
  public subscribe(listener: GameListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (error) {
        console.error("Game listener failed:", error);
      }
    }
  }

  // ------------------------------------------------------------------ state

  public getStatus(): GameStatus {
    return this.status;
  }

  public getPlatoons(): Platoon[] {
    return this.platoons;
  }

  public getGameState(): {
    status: GameStatus;
    tick: number;
    autonomous: boolean;
    outcome: GameOutcome | null;
    platoons: Platoon[];
    objectives: ObjectiveType[];
    landingZones: LandingZoneType[];
    flights: FlightType[];
    events: GameEventType[];
  } {
    return {
      status: this.status,
      tick: this.tickCount,
      autonomous: this.autonomous,
      outcome: this.outcome,
      platoons: this.platoons,
      objectives: this.objectives,
      landingZones: this.landingZones,
      flights: this.getFlights(),
      events: this.events,
    };
  }

  /**
   * A single manual volley, outside the loop. Every unit that has a living
   * enemy in range takes one shot, ignoring cooldown.
   */
  public attackPlatoon(attackerId: string, targetId: string): string {
    const attacker = this.platoons.find((p) => p.id === attackerId);
    const target = this.platoons.find((p) => p.id === targetId);

    if (!attacker || !target) {
      return "One or both platoons not found.";
    }

    const shots = attacker.volleyAgainst(target, this.random);
    for (const { attacker: shooter, target: victim, shot } of shots) {
      if (shot.hit) {
        this.log(
          shot.killed ? "kia" : "hit",
          shot.killed
            ? `${shooter.id} killed ${victim.id}`
            : `${shooter.id} hit ${victim.id} for ${shot.damage}`
        );
      }
    }

    const hits = shots.filter((s) => s.shot.hit).length;
    return `Platoon ${attacker.id} fired ${shots.length} shot(s) at ${target.id}, ${hits} hit.`;
  }
}
