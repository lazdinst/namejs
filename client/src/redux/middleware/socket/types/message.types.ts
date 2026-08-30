import {
  PlatoonType,
  GameStatus,
  GameEventType,
  ObjectiveType,
  LandingZoneType,
  FlightType,
  LobbyState,
} from "shared";

export interface GameOutcome {
  winnerId: string;
  loserId: string;
  reason: "destroyed" | "combat-ineffective" | "objectives";
  tick: number;
}

export interface GameStateMessage {
  type: "gameState";
  payload: {
    status: GameStatus;
    tick: number;
    autonomous: boolean;
    outcome: GameOutcome | null;
    platoons: PlatoonType[];
    objectives: ObjectiveType[];
    landingZones: LandingZoneType[];
    flights: FlightType[];
    events: GameEventType[];
    lobby: LobbyState;
  };
}
