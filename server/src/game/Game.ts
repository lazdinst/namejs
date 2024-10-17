import { GameState, Platoon } from "../types/game";
import { initialPlatoons } from "./gameConfig";

export enum GameStatus {
  NOT_STARTED = "not_started",
  RUNNING = "running",
  PAUSED = "paused",
}

export class Game {
  private status: GameStatus;
  private platoons: Platoon[];

  constructor() {
    this.status = GameStatus.NOT_STARTED;
    this.platoons = initialPlatoons();
  }

  public start(): string {
    if (this.status === GameStatus.RUNNING) {
      return "Game is already running.";
    }
    this.status = GameStatus.RUNNING;
    return "Game started successfully.";
  }

  public pause(): string {
    if (this.status !== GameStatus.RUNNING) {
      return "Game is not running.";
    }
    this.status = GameStatus.PAUSED;
    return "Game paused successfully.";
  }

  public reset(): string {
    this.status = GameStatus.NOT_STARTED;
    this.platoons = initialPlatoons();
    return "Game reset successfully.";
  }

  public getStatus(): GameStatus {
    return this.status;
  }

  public getGameState(): { platoons: Platoon[] } {
    return {
      platoons: this.platoons,
    };
  }

  public attackPlatoon(attackerId: string, targetId: string): string {
    const attacker = this.platoons.find((p) => p.id === attackerId);
    const target = this.platoons.find((p) => p.id === targetId);

    if (!attacker || !target) {
      return "One or both platoons not found.";
    }

    return attacker.attack(target);
  }
}
