import { Coordinate, PlatoonStrategy } from "shared";

export type { GameEventType } from "shared";

export interface CommandType {
  action: "move" | "changeStrategy";
  platoonId: string;
  unitId: string;
  newPosition?: Coordinate;
  newStrategy?: PlatoonStrategy;
}
