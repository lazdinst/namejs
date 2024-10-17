import { Router, Request, Response } from "express";

const router = Router();

// Start the game
router.post("/start", (req: Request, res: Response) => {
  res.json({ message: "Game started" });
});

// Pause the game
router.post("/pause", (req: Request, res: Response) => {
  res.json({ message: "Game paused" });
});

// Reset the game
router.post("/reset", (req: Request, res: Response) => {
  res.json({ message: "Game reset to initial state" });
});

export default router;
