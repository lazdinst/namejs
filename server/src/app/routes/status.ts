import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    status: "running",
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
