import { Router, Request, Response } from "express";
import { game } from "../../server/server";

const router = Router();

// Get all units
router.get("/", (req: Request, res: Response) => {
  const units = game
    .getGameState()
    .platoons.flatMap((platoon) => platoon.units);
  res.json({ units });
});

// Get specific unit by ID
router.get("/:unitId", (req: Request, res: Response) => {
  const { unitId } = req.params;
  const unit = game
    .getGameState()
    .platoons.flatMap((platoon) => platoon.units)
    .find((u) => u.id === unitId);
  if (unit) {
    res.json({ unit });
  } else {
    res.status(404).json({ message: `Unit with ID: ${unitId} not found` });
  }
});

// Update unit attributes
router.patch("/:unitId", (req: Request, res: Response) => {
  const { unitId } = req.params;
  const unit = game
    .getGameState()
    .platoons.flatMap((platoon) => platoon.units)
    .find((u) => u.id === unitId);
  if (unit) {
    // Here you can update specific attributes of the unit
    // For example, updating the position
    unit.position = req.body.position || unit.position;
    res.json({ message: `Unit with ID: ${unitId} updated`, unit });
  } else {
    res.status(404).json({ message: `Unit with ID: ${unitId} not found` });
  }
});

// Engage an enemy with a specific unit
router.post("/:unitId/engage", (req: Request, res: Response) => {
  const { unitId } = req.params;
  const unit = game
    .getGameState()
    .platoons.flatMap((platoon) => platoon.units)
    .find((u) => u.id === unitId);
  if (unit) {
    // Engage logic here
    res.json({ message: `Unit with ID: ${unitId} is engaging the enemy` });
  } else {
    res.status(404).json({ message: `Unit with ID: ${unitId} not found` });
  }
});

export default router;
