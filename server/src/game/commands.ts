import { Coordinate, PlatoonStrategy } from "shared";
import { CommandType } from "../types/game";
import { Platoon } from "./Platoon";

export interface CommandResult {
  ok: boolean;
  message: string;
}

const isCoordinate = (value: unknown): value is Coordinate =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((n) => typeof n === "number" && Number.isFinite(n)) &&
  value[0] >= -90 &&
  value[0] <= 90 &&
  value[1] >= -180 &&
  value[1] <= 180;

const isStrategy = (value: unknown): value is PlatoonStrategy =>
  typeof value === "string" &&
  (Object.values(PlatoonStrategy) as string[]).includes(value);

/**
 * Validate an untrusted payload from a WebSocket message or an HTTP body.
 * Returns null when the payload is not a command we can act on.
 */
export function parseCommand(payload: unknown): CommandType | null {
  if (typeof payload !== "object" || payload === null) return null;

  const candidate = payload as Record<string, unknown>;

  if (candidate.action === "move") {
    if (typeof candidate.unitId !== "string") return null;
    if (!isCoordinate(candidate.newPosition)) return null;

    return {
      action: "move",
      platoonId: typeof candidate.platoonId === "string" ? candidate.platoonId : "",
      unitId: candidate.unitId,
      newPosition: candidate.newPosition,
    };
  }

  if (candidate.action === "changeStrategy") {
    if (typeof candidate.platoonId !== "string") return null;
    if (!isStrategy(candidate.newStrategy)) return null;

    return {
      action: "changeStrategy",
      platoonId: candidate.platoonId,
      unitId: "",
      newStrategy: candidate.newStrategy,
    };
  }

  return null;
}

/**
 * Apply one validated command to the platoon list. Called at a tick boundary,
 * never mid-tick, so a command can never land halfway through an update.
 */
export function applyCommand(
  command: CommandType,
  platoons: Platoon[]
): CommandResult {
  if (command.action === "move") {
    const unit = platoons
      .flatMap((platoon) => platoon.units)
      .find((u) => u.id === command.unitId);

    if (!unit) {
      return { ok: false, message: `Unit ${command.unitId} not found.` };
    }
    if (!unit.isAlive()) {
      return { ok: false, message: `Unit ${command.unitId} is KIA.` };
    }

    unit.setDestination(command.newPosition ?? null);
    return {
      ok: true,
      message: `Unit ${unit.id} ordered to ${command.newPosition}.`,
    };
  }

  if (command.action === "changeStrategy") {
    const platoon = platoons.find((p) => p.id === command.platoonId);

    if (!platoon) {
      return { ok: false, message: `Platoon ${command.platoonId} not found.` };
    }

    platoon.strategy = command.newStrategy!;
    return {
      ok: true,
      message: `Platoon ${platoon.id} strategy set to ${platoon.strategy}.`,
    };
  }

  return { ok: false, message: "Unknown command." };
}
