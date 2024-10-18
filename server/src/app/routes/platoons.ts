import { Router, Request, Response } from "express";
import { game } from "../../server/server";

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
