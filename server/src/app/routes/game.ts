import { Router, Request, Response } from 'express';

const router = Router();

// Start the game
router.post('/game/start', (req: Request, res: Response) => {
  res.json({ message: 'Game started' });
});

// Pause the game
router.post('/game/pause', (req: Request, res: Response) => {
  res.json({ message: 'Game paused' });
});

// Reset the game
router.post('/game/reset', (req: Request, res: Response) => {
  res.json({ message: 'Game reset to initial state' });
});

export default router;
