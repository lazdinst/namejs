import { Router, Request, Response } from "express";
import { game, lobby } from "../../game/instance";
import { PlatoonStrategy } from "shared";

/**
 * Once a player match is running, a player may only command the element of
 * the faction they sat down on. Outside a match (admin mode) anything goes.
 */
const mayCommand = (req: Request, platoonId: string): string | null => {
  const state = lobby.getState();
  if (state.phase !== "deployed") return null;

  const playerId = req.header("x-player-id");
  const seat = state.players.find((p) => p.id === playerId);
  if (!seat) return "You are not seated in this match.";

  const platoon = game.getPlatoons().find((p) => p.id === platoonId);
  if (platoon && platoon.faction !== seat.faction) {
    return "That element is not yours to command.";
  }
  return null;
};

const router = Router();

// Get all platoons
router.get("/", (req: Request, res: Response) => {
  res.json({ platoons: game.getGameState().platoons });
});

// Get specific platoon by ID
router.get("/:platoonId", (req: Request, res: Response) => {
  const { platoonId } = req.params;
  const platoon = game.getGameState().platoons.find((p) => p.id === platoonId);
  if (platoon) {
    res.json({ platoon });
  } else {
    res
      .status(404)
      .json({ message: `Platoon with ID: ${platoonId} not found` });
  }
});

// Order a whole element to a point on the map.
router.post("/:platoonId/move", (req: Request, res: Response) => {
  const { platoonId } = req.params;
  const denied = mayCommand(req, platoonId);
  if (denied) {
    res.status(403).json({ message: denied });
    return;
  }

  const position = req.body?.position;
  const valid =
    Array.isArray(position) &&
    position.length === 2 &&
    position.every((n: unknown) => typeof n === "number" && Number.isFinite(n));
  if (!valid) {
    res.status(400).json({ message: "position must be [latitude, longitude]" });
    return;
  }

  const result = game.movePlatoon(platoonId, position as [number, number]);
  res.status(result.ok ? 200 : 404).json({ message: result.message });
});

// Change an element's posture.
router.post("/:platoonId/strategy", (req: Request, res: Response) => {
  const { platoonId } = req.params;
  const denied = mayCommand(req, platoonId);
  if (denied) {
    res.status(403).json({ message: denied });
    return;
  }

  const strategy = req.body?.strategy;
  if (!Object.values(PlatoonStrategy).includes(strategy)) {
    res.status(400).json({ message: `strategy must be one of: ${Object.values(PlatoonStrategy).join(", ")}` });
    return;
  }

  const result = game.setPlatoonStrategy(platoonId, strategy);
  res.status(result.ok ? 200 : 404).json({ message: result.message });
});

// Update platoon attributes
router.patch("/:platoonId", (req: Request, res: Response) => {
  const { platoonId } = req.params;
  const platoon = game.getGameState().platoons.find((p) => p.id === platoonId);
  if (platoon) {
    platoon.strategy = req.body.strategy || platoon.strategy;
    res.json({ message: `Platoon with ID: ${platoonId} updated`, platoon });
  } else {
    res
      .status(404)
      .json({ message: `Platoon with ID: ${platoonId} not found` });
  }
});

export default router;
