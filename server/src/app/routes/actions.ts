import { Router, Request, Response } from "express";

const router = Router();

// Placeholder for handling specific in-game actions such as movement, attack, etc.
router.post("/:actionId", (req: Request, res: Response) => {
  const { actionId } = req.params;
  res.json({ message: `Perform action with ID: ${actionId}` });
});

export default router;
