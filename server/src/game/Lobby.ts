import {
  PlatoonFaction,
  PlatoonStrategy,
  LobbyState,
  LobbyPlayer,
  LobbyPhase,
  Loadout,
  Mos,
  SoldierCard,
  ElementBuild,
  defaultLoadout,
  validateElement,
  validateLoadout,
  factionsOpen,
  DRAFT_SECONDS,
  ELEMENT_MAX_SIZE,
  ELEMENT_MIN_SIZE,
} from "shared";
import { Game } from "./Game";
import { CommandResult } from "./commands";

/**
 * Two seats, one clock. The lobby owns the match flow; the game owns the
 * fight. When both players have picked a landing zone the lobby hands the
 * elements to the game and steps out of the way.
 */
export class Lobby {
  private phase: LobbyPhase = "waiting";
  private players: LobbyPlayer[] = [];
  private draftDeadline: number | null = null;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly game: Game,
    private readonly now: () => number = Date.now
  ) {}

  // ---------------------------------------------------------------- state

  public getState(): LobbyState {
    return {
      phase: this.phase,
      players: this.players,
      draftDeadline: this.draftDeadline,
      taken: this.players.flatMap((p) => p.slots.map((s) => s.soldier.id)),
    };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }

  private player(id: string): LobbyPlayer | undefined {
    return this.players.find((p) => p.id === id);
  }

  // ----------------------------------------------------------------- join

  public join(playerId: string, faction: PlatoonFaction): CommandResult {
    if (this.phase !== "waiting") {
      return { ok: false, message: "The match has already started." };
    }
    if (this.player(playerId)) {
      return { ok: false, message: "You are already in the lobby." };
    }
    if (!factionsOpen(this.players).includes(faction)) {
      return { ok: false, message: `${faction.toUpperCase()} is taken.` };
    }

    this.players.push({
      id: playerId,
      faction,
      elementName: `ODA ${faction === PlatoonFaction.USEC ? "0321" : "0322"}`,
      slots: [],
      ready: false,
      landingZoneId: null,
    });

    if (this.players.length === 2) this.openDraft();
    this.emit();
    return { ok: true, message: `Joined as ${faction.toUpperCase()}.` };
  }

  public leave(playerId: string): void {
    if (this.phase !== "waiting") return;
    this.players = this.players.filter((p) => p.id !== playerId);
    this.emit();
  }

  // ---------------------------------------------------------------- draft

  private openDraft(): void {
    this.phase = "draft";
    this.draftDeadline = this.now() + DRAFT_SECONDS * 1000;
    this.timer = setInterval(() => this.tickClock(), 250);
    this.timer.unref?.();
  }

  /** Called on a clock; closes the draft when the deadline passes. */
  public tickClock(): void {
    if (this.phase !== "draft" || this.draftDeadline === null) return;
    if (this.now() < this.draftDeadline) return;

    for (const p of this.players) {
      if (!p.ready) this.autoComplete(p);
      p.ready = true;
    }
    this.closeDraft();
  }

  private soldier(id: string): SoldierCard | undefined {
    return this.game.getRoster().find((s) => s.id === id);
  }

  private takenIds(): Set<string> {
    return new Set(this.players.flatMap((p) => p.slots.map((s) => s.soldier.id)));
  }

  public pick(playerId: string, soldierId: string): CommandResult {
    const p = this.player(playerId);
    if (!p || this.phase !== "draft") return { ok: false, message: "Draft is not open." };
    if (p.ready) return { ok: false, message: "You have already readied up." };
    if (p.slots.length >= ELEMENT_MAX_SIZE) return { ok: false, message: "Element is full." };

    const soldier = this.soldier(soldierId);
    if (!soldier) return { ok: false, message: "No such soldier." };
    if (this.takenIds().has(soldierId)) return { ok: false, message: `${soldier.callsign} is taken.` };

    p.slots.push({ soldier, loadout: defaultLoadout(soldier.mos) });
    this.emit();
    return { ok: true, message: `Picked ${soldier.callsign}.` };
  }

  public unpick(playerId: string, soldierId: string): CommandResult {
    const p = this.player(playerId);
    if (!p || this.phase !== "draft" || p.ready) return { ok: false, message: "Cannot change picks now." };
    p.slots = p.slots.filter((s) => s.soldier.id !== soldierId);
    this.emit();
    return { ok: true, message: "Released." };
  }

  public setLoadout(playerId: string, soldierId: string, loadout: Loadout): CommandResult {
    const p = this.player(playerId);
    if (!p || this.phase !== "draft" || p.ready) return { ok: false, message: "Cannot change loadout now." };
    const slot = p.slots.find((s) => s.soldier.id === soldierId);
    if (!slot) return { ok: false, message: "That man is not in your element." };

    const problems = validateLoadout(slot.soldier.mos, loadout);
    if (problems.length) return { ok: false, message: problems.map((x) => x.message).join("; ") };

    slot.loadout = loadout;
    this.emit();
    return { ok: true, message: "Loadout set." };
  }

  public setName(playerId: string, name: string): CommandResult {
    const p = this.player(playerId);
    if (!p || this.phase !== "draft") return { ok: false, message: "Not now." };
    p.elementName = name.trim().slice(0, 24) || p.elementName;
    this.emit();
    return { ok: true, message: "Named." };
  }

  private buildFor(p: LobbyPlayer, landingZoneId = "LZ-1"): ElementBuild {
    return {
      name: p.elementName,
      faction: p.faction,
      strategy: PlatoonStrategy.AGGRESSIVE,
      landingZoneId,
      slots: p.slots,
    };
  }

  public ready(playerId: string): CommandResult {
    const p = this.player(playerId);
    if (!p || this.phase !== "draft") return { ok: false, message: "Draft is not open." };

    const problems = validateElement(this.buildFor(p));
    if (problems.length) return { ok: false, message: problems.map((x) => x.message).join("; ") };

    p.ready = true;
    if (this.players.every((x) => x.ready)) this.closeDraft();
    this.emit();
    return { ok: true, message: "Ready." };
  }

  /**
   * The clock ran out on an incomplete element. Fill it to a legal minimum
   * from whoever is left on the board so the match can go ahead.
   */
  private autoComplete(p: LobbyPlayer): void {
    const taken = this.takenIds();
    const free = this.game.getRoster().filter((s) => !taken.has(s.id));
    const has = (m: Mos) => p.slots.some((s) => s.soldier.mos === m);
    const grab = (pred: (s: SoldierCard) => boolean) => {
      const s = free.find((x) => pred(x) && !taken.has(x.id));
      if (s) { p.slots.push({ soldier: s, loadout: defaultLoadout(s.mos) }); taken.add(s.id); }
    };

    if (!has(Mos.A18) && !has(Mos.Z18)) grab((s) => s.mos === Mos.A18 || s.mos === Mos.Z18);
    if (!has(Mos.D18)) grab((s) => s.mos === Mos.D18);
    while (p.slots.length < ELEMENT_MIN_SIZE) {
      const before = p.slots.length;
      grab((s) => s.mos !== Mos.A18);
      if (p.slots.length === before) break;
    }
  }

  private closeDraft(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.draftDeadline = null;
    this.phase = "landing";
    this.emit();
  }

  // ------------------------------------------------------------- landing

  public chooseLandingZone(playerId: string, landingZoneId: string): CommandResult {
    const p = this.player(playerId);
    if (!p || this.phase !== "landing") return { ok: false, message: "Not choosing landing zones now." };
    if (!this.game.getLandingZones().some((z) => z.id === landingZoneId)) {
      return { ok: false, message: `No landing zone ${landingZoneId}.` };
    }

    p.landingZoneId = landingZoneId;
    if (this.players.every((x) => x.landingZoneId)) this.launch();
    this.emit();
    return { ok: true, message: `Landing at ${landingZoneId}.` };
  }

  /** Both zones chosen: clear the seeded platoons, drop both elements, go. */
  private launch(): void {
    this.game.reset();
    this.game.clearPlatoons();

    for (const p of this.players) {
      const result = this.game.deploy(this.buildFor(p, p.landingZoneId!));
      if (!result.ok) throw new Error(`Deploy failed for ${p.id}: ${result.message}`);
    }

    this.phase = "deployed";
    this.game.start();
    this.emit();
  }

  /**
   * The match is over — tear everything down for a new one. The game is reset
   * (loop stopped, flights cleared, a fresh draft board issued) and both seats
   * are emptied, so everyone lands back on the join screen.
   */
  public rematch(): CommandResult {
    this.game.reset();
    this.reset();
    return { ok: true, message: "Lobby is open for a new match." };
  }

  /** Back to an empty lobby. Does not touch the game. */
  public reset(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.phase = "waiting";
    this.players = [];
    this.draftDeadline = null;
    this.emit();
  }
}
