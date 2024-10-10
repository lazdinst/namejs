import { gameState } from "./gameState";
import { Command } from "../types/game";

export const updateGameState = (command: Command): void => {
  if (command.action === "move") {
    const platoon = gameState.platoons.find((p) => p.id === command.platoonId);
    if (platoon && command.newPosition !== undefined) {
      platoon.units.forEach((unit) => {
        if (command.newPosition) {
          unit.position = command.newPosition; // For simplicity, move all units together
        }
      });
    }
  } else if (command.action === "changeStrategy") {
    const platoon = gameState.platoons.find((p) => p.id === command.platoonId);
    if (platoon && command.newStrategy) {
      platoon.strategy = command.newStrategy;
    }
  }
  console.log("Updated game state:", gameState);
};
