import { PlatoonFaction } from "./platoon";
import { ElementSlot } from "./element";

/**
 * A match goes through four phases. Players join and take a faction; once
 * both seats are filled the draft opens against a clock; when both are ready
 * each picks a landing zone; then the elements drop and the fight is on.
 */
export type LobbyPhase = "waiting" | "draft" | "landing" | "deployed";

export interface LobbyPlayer {
  id: string;
  faction: PlatoonFaction;
  elementName: string;
  slots: ElementSlot[];
  ready: boolean;
  landingZoneId: string | null;
}

export interface LobbyState {
  phase: LobbyPhase;
  players: LobbyPlayer[];
  /** Wall-clock ms when the draft closes, while in the draft phase. */
  draftDeadline: number | null;
  /** Soldier ids already taken by either player. */
  taken: string[];
}

export const DRAFT_SECONDS = 30;

export const factionsOpen = (players: LobbyPlayer[]): PlatoonFaction[] =>
  Object.values(PlatoonFaction).filter(
    (f) => !players.some((p) => p.faction === f)
  );
