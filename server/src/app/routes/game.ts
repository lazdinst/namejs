import { Router, Request, Response } from "express";
import { AttackRequest, AttackRequestBody } from "../../types/requestTypes";

import { game } from "../../server/server";

const router = Router();

// Start the game
router.post("/start", (req: Request, res: Response) => {
  const result = game.start();
  res.json({ message: result, status: game.getStatus() });
});

// Pause the game
router.post("/pause", (req: Request, res: Response) => {
  const result = game.pause();
  res.json({ message: result, status: game.getStatus() });
});

// Reset the game
router.post("/reset", (req: Request, res: Response) => {
  const result = game.reset();
  res.json({ message: result, status: game.getStatus() });
});

// Get the current game state
router.get("/state", (req: Request, res: Response) => {
  res.json({ state: game.getGameState(), status: game.getStatus() });
});

router.post(
  "/attack",
  (req: Request<{}, {}, AttackRequestBody>, res: Response) => {
    const { attackerId, targetId } = req.body as {
      attackerId: string;
      targetId: string;
    };

    const result = game.attackPlatoon(attackerId, targetId);
    res.json({
      message: result,
      state: game.getGameState(),
    });
  }
);

export default router;
