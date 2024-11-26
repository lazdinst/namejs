import { Platoon } from "../../../../../../server/src/game/Platoon";

export interface GameStateMessage {
  type: string;
  payload: {
    status: string;
    platoons: Platoon[];
  };
}
