import { Router, Request, Response } from "express";
import { game } from "../../game/instance";
import { parseCommand } from "../../game/commands";

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

// Order a unit to move to a position. The unit walks there over subsequent
// ticks rather than teleporting.
router.post("/:unitId/move", (req: Request, res: Response) => {
  const command = parseCommand({
    action: "move",
    unitId: req.params.unitId,
    newPosition: req.body?.position,
  });

  if (!command) {
    res
      .status(400)
      .json({ message: "position must be [latitude, longitude]" });
    return;
  }

  const result = game.applyCommandNow(command);

  if (!result.ok) {
    res.status(404).json({ message: result.message });
    return;
  }

  const unit = game
    .getPlatoons()
    .flatMap((platoon) => platoon.units)
    .find((u) => u.id === req.params.unitId);

  res.json({ message: result.message, unit });
});

// Stop a unit where it stands.
router.post("/:unitId/halt", (req: Request, res: Response) => {
  const unit = game
    .getPlatoons()
    .flatMap((platoon) => platoon.units)
    .find((u) => u.id === req.params.unitId);

  if (!unit) {
    res.status(404).json({ message: `Unit with ID: ${req.params.unitId} not found` });
    return;
  }

  unit.setDestination(null);
  res.json({ message: `Unit ${unit.id} halted.`, unit });
});

export default router;
