import { Command, Unit } from "../types/game";
import { gameState } from "./gameState";

export const processCommand = (command: Command): string => {
  if (command.action === "move") {
    const unit = gameState.platoons
      .flatMap((platoon) => platoon.units)
      .find((u) => u.id === command.unitId);

    if (unit && command.newPosition !== undefined) {
      unit.position = command.newPosition;
      return `Unit ${unit.id} moved to new position ${command.newPosition}`;
    } else {
      return `Unit with ID ${command.unitId} not found or invalid new position`;
    }
  }

  return "Unknown command";
};
