import { PlatoonType } from "shared";
export interface GameStateMessage {
  type: string;
  payload: {
    status: string;
    platoons: PlatoonType[];
  };
}
