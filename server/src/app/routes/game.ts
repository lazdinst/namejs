import { Router, Request, Response } from "express";
import { AttackRequestBody } from "../../types/requestTypes";
import { game } from "../../game/instance";
import { ElementBuild } from "shared";

const router = Router();

const stateResponse = (message: string) => ({
  message,
  status: game.getStatus(),
  tick: game.getTickCount(),
  timeScale: game.getTimeScale(),
  autonomous: game.isAutonomous(),
});

router.post("/start", (_req: Request, res: Response) => {
  res.json(stateResponse(game.start()));
});

router.post("/pause", (_req: Request, res: Response) => {
  res.json(stateResponse(game.pause()));
});

router.post("/reset", (_req: Request, res: Response) => {
  res.json(stateResponse(game.reset()));
});

// Advance the simulation by hand. Useful while the loop is paused, for
// stepping through a scenario one tick at a time.
router.post("/step", (req: Request, res: Response) => {
  const requested = Number(req.body?.ticks ?? 1);

  if (!Number.isInteger(requested) || requested < 1 || requested > 1000) {
    res.status(400).json({ message: "ticks must be an integer from 1 to 1000" });
    return;
  }

  for (let i = 0; i < requested; i += 1) {
    game.tick();
  }

  res.json(stateResponse(`Advanced ${requested} tick(s).`));
});

// Simulated seconds per real second.
router.post("/timescale", (req: Request, res: Response) => {
  const scale = Number(req.body?.timeScale);

  if (!Number.isFinite(scale) || scale <= 0) {
    res.status(400).json({ message: "timeScale must be a positive number" });
    return;
  }

  game.setTimeScale(scale);
  res.json(stateResponse(`Time scale set to ${scale}×.`));
});

// Admin/observer mode: with autonomy on, both sides act on their own strategy
// and a single operator can just press start.
router.post("/autonomy", (req: Request, res: Response) => {
  const enabled = req.body?.enabled;

  if (typeof enabled !== "boolean") {
    res.status(400).json({ message: "enabled must be a boolean" });
    return;
  }

  res.json(stateResponse(game.setAutonomous(enabled)));
});

// The draft board a player builds an element from.
router.get("/roster", (_req: Request, res: Response) => {
  res.json({
    roster: game.getRoster(),
    landingZones: game.getLandingZones(),
  });
});

// Drop in: validate a build and put it on a helicopter to its LZ.
router.post("/deploy", (req: Request, res: Response) => {
  const result = game.deploy(req.body as ElementBuild);

  if (!result.ok) {
    res.status(400).json({ message: result.message });
    return;
  }

  res.json({ ...stateResponse(result.message), flightId: result.flightId });
});

router.get("/state", (_req: Request, res: Response) => {
  res.json({ state: game.getGameState(), status: game.getStatus() });
});

router.post(
  "/attack",
  (req: Request<object, object, AttackRequestBody>, res: Response) => {
    const { attackerId, targetId } = req.body;

    const result = game.attackPlatoon(attackerId, targetId);
    res.json({ message: result, state: game.getGameState() });
  }
);

export default router;
