import {
  Role,
  WeaponType,
  SightType,
  AmmunitionType,
  InventoryType,
  BodyPart,
  UnitStatusType,
  HealthStatus,
  CoverType,
  Coordinate,
  defaultInventory,
  defaultBodyParts,
  defaultWeapons,
  defaultSpeeds,
  distanceMeters,
  moveTowards,
  weaponEffectiveRange,
  weaponRateOfFire,
  weaponAmmunitionType,
  weaponMagazineSize,
  weaponReloadSeconds,
  ammunitionProperties,
  hitChance,
  coverAt,
  coverDamageMultiplier,
  speedMultiplierAt,
  MoraleState,
  moraleStateFor,
  suppressionAccuracy,
  suppressionSpeed,
  MORALE_PER_DAMAGE,
  MORALE_DRAIN_PER_SECOND,
  MORALE_RECOVERY_PER_SECOND,
  SUPPRESSION_DECAY_PER_SECOND,
  PINNED_THRESHOLD,
  BleedSeverity,
  Vitals,
  vitalsFor,
  bleedFromDamage,
  shockAccuracy,
  shockSpeed,
  BLEED_RATE,
  BLOOD_LOSS_PER_DAMAGE,
  BLOOD_INCAPACITATED,
  BLOOD_FATAL,
  TREAT_SECONDS,
  TRANSFUSION_PER_SECOND,
  DOWNED_BLEED_MULTIPLIER,
  BROKEN_FLIGHT_SPEED,
  LIGHT_BLEED_CLOTS_AFTER_SECONDS,
  DamageRecord,
  DAMAGE_LOG_LIMIT,
  damageByAttacker,
  assistsFor,
  Mos,
  Attributes,
  SoldierCard,
  Loadout,
  mosDefinitions,
  marksmanshipMultiplier,
  composureResistance,
  fitnessSpeedMultiplier,
  awarenessRangeMultiplier,
  medicineSpeedMultiplier,
  encumbranceSpeed,
  weaponMagazineSize as magSize,
} from "shared";

export const UNIT_MAX_HEALTH = 420;

/** Closer than this to its destination, a unit is considered to have arrived. */
export const ARRIVAL_THRESHOLD_METERS = 1;

export type WeaponSlot = "primary" | "secondary";

/** Safety cap so a very high cadence at a very high time scale cannot run away. */
export const MAX_SHOTS_PER_TICK = 16;

/** Where a wound came from, so a casualty can say who did it. */
export interface DamageSource {
  attackerId: string;
  weapon: WeaponType;
  absorbed: number;
  meters: number;
  tick: number;
}

export interface ShotResult {
  hit: boolean;
  damage: number;
  meters: number;
  killed: boolean;
  /** Damage stopped by the target's cover. */
  absorbed: number;
  cover: CoverType;
}

/** Attributes for a unit built the old way, from a bare role: an average man. */
const AVERAGE: Attributes = {
  marksmanship: 5,
  composure: 5,
  fitness: 5,
  awareness: 5,
  medicine: 5,
  leadership: 5,
};

export class Unit {
  public id: string;
  /** Who this man is. Null for a unit seeded from a bare role. */
  public callsign: string | null = null;
  public mos: Mos | null = null;
  public attributes: Attributes = { ...AVERAGE };
  /** Grenades carried in, spent as thrown. */
  public fragGrenades = 0;
  public smokeGrenades = 0;
  /** Encumbrance and fitness folded into one movement multiplier. */
  private conditioning = 1;
  /** Posture multipliers, stamped from the platoon strategy each tick. */
  public postureSpeed = 1;
  /** Multiplier on enemy hit chance against this unit. */
  public postureExposure = 1;
  public position: Coordinate;
  public destination: Coordinate | null;
  public speedMetersPerSecond: number;
  /** Unit currently being engaged, resolved fresh each tick. */
  public targetId: string | null;
  /** Simulated seconds remaining before this unit can fire again. */
  public fireCooldown: number;
  /** Where this unit was placed, used as its anchor for holding and patrolling. */
  public readonly spawnPosition: Coordinate;
  /** True while following an operator order, which overrides autonomous intent. */
  public hasOrders: boolean;
  /** Patrol leg direction, flipped each time the unit reaches an end. */
  public patrolOutbound: boolean;
  /** Which weapon is up. Falls back to secondary when the primary runs dry. */
  public activeWeapon: WeaponSlot;
  /** Rounds in the loaded magazine of the active weapon. */
  public magazine: number;
  /** Simulated seconds left in a reload, or 0 when not reloading. */
  public reloadRemaining: number;
  public health: number;
  public healthStatus: HealthStatus;
  public status: UnitStatusType;
  /** Circulating blood volume, 1 is whole. */
  public bloodVolume: number;
  /** Open bleeds, each draining volume until dressed. */
  public bleeds: BleedSeverity[];
  public vitals: Vitals;
  /** Down from blood loss: alive, out of the fight, dying on a clock. */
  public incapacitated: boolean;
  /** Casualty this medic is working on. */
  public patient: string | null;
  /** Simulated seconds left on the dressing in progress. */
  public treatRemaining: number;
  /** True while a medic has hands on this unit — it stays put to be worked on. */
  public underTreatment: boolean;
  /** Every round that connected, and who fired it. */
  public damageTaken: DamageRecord[];
  /** Whoever landed the finishing round. */
  public killedBy: string | null;
  /** Units this one finished off. */
  public kills: string[];
  /** Casualties this unit did real work on without finishing. */
  public assists: string[];
  /** How long each open bleed has been running, for natural clotting. */
  private bleedAge: number[] = [];
  /** How hard this unit is being shot at, 0–1. */
  public suppression: number;
  /** Willingness to keep fighting, 0–1. */
  public morale: number;
  public moraleState: MoraleState;
  public cover: CoverType;
  public role: Role;
  public inventory: InventoryType;
  public bodyParts: BodyPart[];
  public primaryWeapon: WeaponType;
  public secondaryWeapon: WeaponType;
  public primaryWeaponSight: SightType;
  public secondaryWeaponSight: SightType;

  constructor(id: string, position: Coordinate, role: Role) {
    this.id = id;
    this.position = position;
    this.destination = null;
    this.speedMetersPerSecond = defaultSpeeds[role];
    this.targetId = null;
    this.fireCooldown = 0;
    this.spawnPosition = [position[0], position[1]];
    this.hasOrders = false;
    this.patrolOutbound = true;
    this.activeWeapon = "primary";
    this.reloadRemaining = 0;
    this.health = UNIT_MAX_HEALTH;
    this.healthStatus = "healthy";
    this.status = UnitStatusType.Idle;
    this.bloodVolume = 1;
    this.bleeds = [];
    this.vitals = vitalsFor(1);
    this.incapacitated = false;
    this.patient = null;
    this.treatRemaining = 0;
    this.underTreatment = false;
    this.damageTaken = [];
    this.killedBy = null;
    this.kills = [];
    this.assists = [];
    this.suppression = 0;
    this.morale = 1;
    this.moraleState = "steady";
    this.cover = coverAt(position);
    this.role = role;

    // These defaults are shared module-level objects. Clone them, or every unit
    // would mutate the same inventory and the same body parts as everyone else.
    this.inventory = structuredClone(defaultInventory[role]);
    this.bodyParts = structuredClone(defaultBodyParts);

    const {
      primaryWeapon,
      secondaryWeapon,
      primaryWeaponSight,
      secondaryWeaponSight,
    } = defaultWeapons[role];
    this.primaryWeapon = primaryWeapon;
    this.secondaryWeapon = secondaryWeapon;
    this.primaryWeaponSight = primaryWeaponSight;
    this.secondaryWeaponSight = secondaryWeaponSight;

    // Start with a full magazine drawn from the reserve.
    this.magazine = 0;
    this.loadMagazine();
  }

  /**
   * A soldier from the draft board, kitted the way the player chose. Replaces
   * the role-default issue with the loadout, and lets attributes into the
   * simulation.
   */
  public static fromSoldier(
    id: string,
    position: Coordinate,
    card: SoldierCard,
    loadout: Loadout
  ): Unit {
    const def = mosDefinitions[card.mos];
    const unit = new Unit(id, position, def.role);

    unit.callsign = card.callsign;
    unit.mos = card.mos;
    unit.attributes = { ...card.attributes };

    unit.primaryWeapon = loadout.primaryWeapon;
    unit.secondaryWeapon = def.secondaryWeapon;
    unit.primaryWeaponSight = def.primaryWeaponSight;
    unit.activeWeapon = "primary";

    // Ammunition is what the player packed, not the role default.
    const primaryAmmo = weaponAmmunitionType[loadout.primaryWeapon];
    const secondaryAmmo = weaponAmmunitionType[def.secondaryWeapon];
    for (const key of Object.keys(unit.inventory.ammunition)) {
      unit.inventory.ammunition[key as AmmunitionType] = 0;
    }
    unit.inventory.ammunition[primaryAmmo] =
      (loadout.primaryMagazines + 1) * magSize[loadout.primaryWeapon];
    unit.inventory.ammunition[secondaryAmmo] +=
      (loadout.secondaryMagazines + 1) * magSize[def.secondaryWeapon];

    unit.fragGrenades = loadout.fragGrenades;
    unit.smokeGrenades = loadout.smokeGrenades;
    unit.inventory.grenades = loadout.fragGrenades;
    unit.inventory.medicalSupplies.lightBleedingBandages = loadout.bandages;
    unit.inventory.medicalSupplies.heavyBleedingBandages = loadout.tourniquets;

    unit.conditioning =
      fitnessSpeedMultiplier(card.attributes) *
      encumbranceSpeed(card.mos, loadout);
    unit.speedMetersPerSecond = defaultSpeeds[def.role] * unit.conditioning;

    unit.magazine = 0;
    unit.loadMagazine();

    return unit;
  }

  public isAlive(): boolean {
    return this.status !== UnitStatusType.Kia;
  }

  public takeDamage(damage: number, source?: DamageSource): void {
    const wasAlive = this.isAlive();
    this.health = Math.max(0, this.health - damage);
    this.healthStatus = healthStatusFor(this.health);

    // A round costs volume immediately, and may leave a wound still bleeding.
    this.bloodVolume = Math.max(
      0,
      this.bloodVolume - damage * BLOOD_LOSS_PER_DAMAGE
    );

    const bleed = bleedFromDamage(damage);
    if (bleed !== "none") {
      this.bleeds.push(bleed);
      this.bleedAge.push(0);
    }

    if (source) {
      this.damageTaken.push({
        attackerId: source.attackerId,
        weapon: source.weapon,
        damage,
        absorbed: source.absorbed,
        meters: source.meters,
        tick: source.tick,
        bleed,
        fatal: wasAlive && this.health === 0,
      });

      if (this.damageTaken.length > DAMAGE_LOG_LIMIT) {
        this.damageTaken.splice(0, this.damageTaken.length - DAMAGE_LOG_LIMIT);
      }

      if (wasAlive && this.health === 0) this.killedBy = source.attackerId;
    }

    this.refreshVitals();

    // Being wounded is its own shock, on top of the fire that caused it.
    this.drainMorale(damage * MORALE_PER_DAMAGE);

    if (this.health === 0) {
      this.status = UnitStatusType.Kia;
      this.destination = null;
      this.hasOrders = false;
      this.targetId = null;
      this.suppression = 0;
    }
  }

  // ------------------------------------------------------------ physiology

  /** Fraction of blood volume lost per simulated second from open wounds. */
  public bleedRate(): number {
    return this.bleeds.reduce((sum, bleed) => sum + BLEED_RATE[bleed], 0);
  }

  public isBleeding(): boolean {
    return this.bleeds.length > 0;
  }

  public refreshVitals(): void {
    this.vitals = vitalsFor(this.bloodVolume);
  }

  /**
   * Bleed for one tick. A casualty goes down before it dies, which is the
   * window a medic has to work in.
   */
  public bleed(seconds: number): void {
    if (!this.isAlive() || seconds <= 0) return;

    // Light wounds close by themselves given time; heavy ones need a dressing.
    for (let i = this.bleeds.length - 1; i >= 0; i -= 1) {
      this.bleedAge[i] = (this.bleedAge[i] ?? 0) + seconds;
      if (
        this.bleeds[i] === "light" &&
        this.bleedAge[i] >= LIGHT_BLEED_CLOTS_AFTER_SECONDS
      ) {
        this.bleeds.splice(i, 1);
        this.bleedAge.splice(i, 1);
      }
    }

    // Prone and still, a casualty bleeds far slower — that gap is the medic's
    // window, and without it every wound is simply a delayed death.
    const rate =
      this.bleedRate() * (this.incapacitated ? DOWNED_BLEED_MULTIPLIER : 1);
    if (rate > 0) {
      this.bloodVolume = Math.max(0, this.bloodVolume - rate * seconds);
    }

    this.refreshVitals();

    if (this.bloodVolume <= BLOOD_FATAL) {
      this.health = 0;
      this.healthStatus = "kia";
      this.status = UnitStatusType.Kia;
      this.destination = null;
      this.hasOrders = false;
      this.targetId = null;
      this.incapacitated = false;
      return;
    }

    // Below this a casualty is on the ground: alive, but out of it.
    this.incapacitated = this.bloodVolume <= BLOOD_INCAPACITATED;
    if (this.incapacitated) {
      this.destination = null;
      this.hasOrders = false;
      this.targetId = null;
    }
  }

  /** Able to move, shoot and be given orders. */
  public isEffective(): boolean {
    return this.isAlive() && !this.incapacitated;
  }

  /** Dress the worst open bleed. Returns what was treated. */
  public dressWound(): BleedSeverity {
    const index = this.bleeds.indexOf("heavy");
    const at = index >= 0 ? index : this.bleeds.length - 1;
    if (at < 0) return "none";

    const [treated] = this.bleeds.splice(at, 1);
    this.bleedAge.splice(at, 1);
    return treated;
  }

  /** Put volume back, up to whole. */
  public transfuse(amount: number): void {
    this.bloodVolume = Math.min(1, this.bloodVolume + amount);
    this.refreshVitals();
    if (this.bloodVolume > BLOOD_INCAPACITATED) this.incapacitated = false;
  }

  // ------------------------------------------------- suppression and morale

  /** Take incoming fire. Hits and near misses both press a unit down. */
  public suppress(amount: number): void {
    if (!this.isAlive() || amount <= 0) return;
    // A composed man takes the same fire and is pressed down less by it.
    this.suppression = Math.min(
      1,
      this.suppression + amount * composureResistance(this.attributes)
    );
  }

  /** Held down by fire: cannot advance, and shoots badly. */
  public isPinned(): boolean {
    return this.isAlive() && this.suppression >= PINNED_THRESHOLD;
  }

  public drainMorale(amount: number): void {
    if (!this.isAlive() || amount <= 0) return;
    this.morale = Math.max(
      0,
      this.morale - amount * composureResistance(this.attributes)
    );
    this.moraleState = moraleStateFor(this.moraleState, this.morale);
  }

  public recoverMorale(amount: number): void {
    if (!this.isAlive() || amount <= 0) return;
    this.morale = Math.min(1, this.morale + amount);
    this.moraleState = moraleStateFor(this.moraleState, this.morale);
  }

  public isBroken(): boolean {
    return this.isAlive() && this.moraleState === "broken";
  }

  public isShaken(): boolean {
    return this.isAlive() && this.moraleState === "shaken";
  }

  /**
   * Bleed off suppression and settle morale for one tick.
   * `underFire` keeps morale draining while the rounds are still coming.
   */
  public settleNerves(seconds: number, underFire: boolean): void {
    if (!this.isAlive()) return;

    this.suppression = Math.max(
      0,
      this.suppression - SUPPRESSION_DECAY_PER_SECOND * seconds
    );

    if (underFire || this.suppression > 0.05) {
      this.drainMorale(
        MORALE_DRAIN_PER_SECOND * this.suppression * seconds
      );
      return;
    }

    this.recoverMorale(MORALE_RECOVERY_PER_SECOND * seconds);
  }

  /** Recover faster with a leader close by. */
  public rally(seconds: number, multiplier: number): void {
    this.recoverMorale(MORALE_RECOVERY_PER_SECOND * multiplier * seconds);
  }

  // ---------------------------------------------------------------- movement

  /**
   * An operator order. Overrides autonomous intent until the unit arrives or
   * is halted, so a human can always take a unit off its own plan.
   */
  public setDestination(destination: Coordinate | null): void {
    this.destination = destination;
    this.hasOrders = destination !== null;

    if (destination === null && this.status === UnitStatusType.Moving) {
      this.status = UnitStatusType.Idle;
    }
  }

  /**
   * Autonomous intent, set by the simulation each tick. Deliberately does not
   * claim the unit the way an operator order does.
   */
  public steer(destination: Coordinate | null): void {
    if (this.hasOrders) return;
    this.destination = destination;

    if (destination === null && this.status === UnitStatusType.Moving) {
      this.status = UnitStatusType.Idle;
    }
  }

  /** Teleport. Used by seeding and by reset — not by the simulation. */
  public move(newPosition: Coordinate): void {
    this.position = newPosition;
    this.cover = coverAt(newPosition);
  }

  /**
   * Advance toward the destination by `seconds` of simulated time, slowed by
   * the ground underfoot. Returns the distance actually covered, in metres.
   */
  public advance(seconds: number): number {
    if (!this.isEffective() || this.destination === null || seconds <= 0) {
      return 0;
    }

    const remaining = distanceMeters(this.position, this.destination);

    if (remaining <= ARRIVAL_THRESHOLD_METERS) {
      this.position = this.destination;
      this.destination = null;
      this.hasOrders = false;
      this.status = UnitStatusType.Idle;
      this.cover = coverAt(this.position);
      return remaining;
    }

    const speed =
      this.speedMetersPerSecond *
      this.postureSpeed *
      speedMultiplierAt(this.position) *
      suppressionSpeed(this.suppression) *
      shockSpeed(this.vitals.shockIndex) *
      (this.isBroken() ? BROKEN_FLIGHT_SPEED : 1);
    const step = Math.min(speed * seconds, remaining);

    this.position = moveTowards(this.position, this.destination, step);
    this.cover = coverAt(this.position);
    this.status = UnitStatusType.Moving;

    return step;
  }

  // ------------------------------------------------------------------ combat

  public weaponInHand(): WeaponType {
    return this.activeWeapon === "primary"
      ? this.primaryWeapon
      : this.secondaryWeapon;
  }

  public sightInHand(): SightType {
    return this.activeWeapon === "primary"
      ? this.primaryWeaponSight
      : this.secondaryWeaponSight;
  }

  public ammoTypeInHand(): AmmunitionType {
    return weaponAmmunitionType[this.weaponInHand()];
  }

  /** How far this unit can put effective fire, in metres. */
  public effectiveRange(): number {
    return weaponEffectiveRange[this.weaponInHand()][this.sightInHand()];
  }

  /** Damage of a single connecting round from the weapon in hand. */
  public damagePerShot(): number {
    return ammunitionProperties[this.ammoTypeInHand()].damage;
  }

  /** Simulated seconds between aimed shots. */
  public secondsBetweenShots(): number {
    return 60 / weaponRateOfFire[this.weaponInHand()];
  }

  /** Reserve rounds available for the weapon in hand. */
  public reserveRounds(): number {
    return this.inventory.ammunition[this.ammoTypeInHand()];
  }

  public isReloading(): boolean {
    return this.reloadRemaining > 0;
  }

  /** True when the magazine is empty and there is nothing left to load. */
  public isOutOfAmmo(): boolean {
    return (
      this.magazine === 0 &&
      this.inventory.ammunition[weaponAmmunitionType[this.primaryWeapon]] ===
        0 &&
      this.inventory.ammunition[weaponAmmunitionType[this.secondaryWeapon]] === 0
    );
  }

  public canFire(): boolean {
    return (
      this.isEffective() &&
      this.fireCooldown <= 0 &&
      !this.isReloading() &&
      this.magazine > 0
    );
  }

  /** Draw a fresh magazine from the reserve. Returns rounds loaded. */
  private loadMagazine(): number {
    const ammoType = this.ammoTypeInHand();
    const capacity = weaponMagazineSize[this.weaponInHand()];
    const available = this.inventory.ammunition[ammoType];
    const loaded = Math.min(capacity, available);

    this.inventory.ammunition[ammoType] = available - loaded;
    this.magazine = loaded;

    return loaded;
  }

  private switchToSecondary(): boolean {
    if (this.activeWeapon === "secondary") return false;
    if (
      this.inventory.ammunition[weaponAmmunitionType[this.secondaryWeapon]] === 0
    ) {
      return false;
    }

    this.activeWeapon = "secondary";
    this.reloadRemaining = weaponReloadSeconds[this.secondaryWeapon];
    return true;
  }

  /**
   * Advance cooldown and any in-progress reload, and decide what to do when
   * the magazine runs dry: reload, transition to the sidearm, or go quiet.
   */
  public serviceWeapon(seconds: number): void {
    this.fireCooldown = Math.max(0, this.fireCooldown - seconds);

    if (this.isReloading()) {
      this.reloadRemaining = Math.max(0, this.reloadRemaining - seconds);
      if (this.reloadRemaining === 0) this.loadMagazine();
      return;
    }

    if (this.magazine > 0) return;

    if (this.reserveRounds() > 0) {
      this.reloadRemaining = weaponReloadSeconds[this.weaponInHand()];
      return;
    }

    this.switchToSecondary();
  }

  /** Backwards-compatible alias — cooldown is serviced with the weapon. */
  public coolDown(seconds: number): void {
    this.serviceWeapon(seconds);
  }

  /**
   * Take a shot at `target`. Returns what happened so the caller can log it.
   * `random` is injected so a firefight can be replayed deterministically.
   */
  public fireAt(target: Unit, random: () => number, tick = 0): ShotResult {
    const meters = distanceMeters(this.position, target.position);
    // A shooter being shot at does not shoot well.
    // The target's movement discipline makes it a harder or easier mark.
    const chance =
      hitChance(meters, this.effectiveRange()) *
      target.postureExposure *
      marksmanshipMultiplier(this.attributes) *
      suppressionAccuracy(this.suppression) *
      shockAccuracy(this.vitals.shockIndex);

    this.fireCooldown = this.secondsBetweenShots();
    this.magazine = Math.max(0, this.magazine - 1);
    this.status = UnitStatusType.Engaged;

    const miss: ShotResult = {
      hit: false,
      damage: 0,
      meters,
      killed: false,
      absorbed: 0,
      cover: target.cover,
    };

    if (chance <= 0 || random() >= chance) return miss;

    const raw = this.damagePerShot();
    const damage = raw * coverDamageMultiplier[target.cover];

    target.takeDamage(damage, {
      attackerId: this.id,
      weapon: this.weaponInHand(),
      absorbed: raw - damage,
      meters,
      tick,
    });

    return {
      hit: true,
      damage,
      meters,
      killed: !target.isAlive(),
      absorbed: raw - damage,
      cover: target.cover,
    };
  }

  /**
   * Every round this unit can put out over `seconds`, at its own cadence.
   *
   * Firing used to be capped at one round per unit per tick, which silently
   * flattened every weapon to the same rate of fire — a machine gunner and a
   * sniper both managed exactly one shot per tick — and kept volume of fire
   * from ever mattering. The cadence tables only mean something if a tick can
   * carry more than one round.
   */
  public fireBurst(
    target: Unit,
    seconds: number,
    random: () => number,
    tick = 0
  ): ShotResult[] {
    const results: ShotResult[] = [];
    if (!this.isAlive() || this.isReloading() || seconds <= 0) return results;

    const cadence = this.secondsBetweenShots();
    let remaining = seconds - this.fireCooldown;

    // Still cooling down from last tick — spend the time and take no shot.
    if (remaining < 0) {
      this.fireCooldown = -remaining;
      return results;
    }

    while (this.magazine > 0 && results.length < MAX_SHOTS_PER_TICK) {
      results.push(this.fireAt(target, random, tick));
      remaining -= cadence;
      if (remaining <= 0) break;
    }

    this.fireCooldown = Math.max(0, -remaining);
    return results;
  }

  // ------------------------------------------------------------ attribution

  /** Total damage each attacker did to this unit, worst first. */
  public attackers(): { attackerId: string; damage: number; rounds: number }[] {
    return damageByAttacker(this.damageTaken);
  }

  /** Whoever did the most damage, whether or not they finished the job. */
  public principalAttacker(): string | null {
    return this.attackers()[0]?.attackerId ?? null;
  }

  /** Everyone who contributed to this casualty without landing the last round. */
  public assistedBy(): string[] {
    return assistsFor(this.damageTaken, this.killedBy);
  }

  /** Damage taken from one particular unit. */
  public damageFrom(attackerId: string): number {
    return this.damageTaken
      .filter((record) => record.attackerId === attackerId)
      .reduce((sum, record) => sum + record.damage, 0);
  }

  /** Whether this unit bled out rather than being shot dead outright. */
  public bledOut(): boolean {
    return !this.isAlive() && this.killedBy === null;
  }

  /** How far this man notices things, scaled by his awareness. */
  public awarenessMultiplier(): number {
    return awarenessRangeMultiplier(this.attributes);
  }

  /** How quickly this man works on a casualty. */
  public medicineMultiplier(): number {
    return medicineSpeedMultiplier(this.attributes);
  }

  /** Distance to another unit, in metres. */
  public distanceTo(other: Unit): number {
    return distanceMeters(this.position, other.position);
  }
}

export function healthStatusFor(health: number): HealthStatus {
  if (health <= 0) return "kia";
  if (health <= UNIT_MAX_HEALTH * 0.25) return "critical";
  if (health < UNIT_MAX_HEALTH) return "wounded";
  return "healthy";
}
