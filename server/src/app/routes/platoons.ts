import { Router, Request, Response } from 'express';

const router = Router();

// Get all platoons
router.get('/platoons', (req: Request, res: Response) => {
  res.json({ message: 'Get all platoons' });
});

// Get specific platoon by ID
router.get('/platoons/:platoonId', (req: Request, res: Response) => {
  const { platoonId } = req.params;
  res.json({ message: `Get details for platoon with ID: ${platoonId}` });
});

// Update platoon attributes
router.patch('/platoons/:platoonId', (req: Request, res: Response) => {
  const { platoonId } = req.params;
  res.json({ message: `Update platoon with ID: ${platoonId}` });
});

export default router;
