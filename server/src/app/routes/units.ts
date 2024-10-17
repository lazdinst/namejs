import { Router, Request, Response } from "express";

const router = Router();

// Get all units
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Get all units" });
});

// Get specific unit by ID
router.get("/:unitId", (req: Request, res: Response) => {
  const { unitId } = req.params;
  res.json({ message: `Get details for unit with ID: ${unitId}` });
});

// Update unit attributes
router.patch("/:unitId", (req: Request, res: Response) => {
  const { unitId } = req.params;
  res.json({ message: `Update unit with ID: ${unitId}` });
});

// Engage an enemy with a specific unit
router.post("/:unitId/engage", (req: Request, res: Response) => {
  const { unitId } = req.params;
  res.json({ message: `Unit with ID: ${unitId} is engaging the enemy` });
});

export default router;
