import { Router, Request, Response } from "express";

const router = Router();

// Get all platoons
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Get all platoons" });
});

// Get specific platoon by ID
router.get("/:platoonId", (req: Request, res: Response) => {
  const { platoonId } = req.params;
  res.json({ message: `Get details for platoon with ID: ${platoonId}` });
});

// Update platoon attributes
router.patch("/:platoonId", (req: Request, res: Response) => {
  const { platoonId } = req.params;
  res.json({ message: `Update platoon with ID: ${platoonId}` });
});

export default router;
