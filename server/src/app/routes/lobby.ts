import { Router, Request, Response } from "express";
import { PlatoonFaction } from "shared";
import { lobby } from "../../game/instance";
import { CommandResult } from "../../game/commands";

const router = Router();

/** Who is asking. The client mints an id once and sends it on every call. */
const playerOf = (req: Request): string | null => {
  const id = req.header("x-player-id");
  return id && /^[\w-]{6,64}$/.test(id) ? id : null;
};

const reply = (res: Response, result: CommandResult) => {
  res.status(result.ok ? 200 : 400).json({ message: result.message, lobby: lobby.getState() });
};

router.get("/", (_req, res) => {
  res.json({ lobby: lobby.getState() });
});

router.post("/join", (req, res) => {
  const id = playerOf(req);
  if (!id) {
    reply(res, { ok: false, message: "Missing player id." });
    return;
  }
  const faction = req.body?.faction;
  if (!Object.values(PlatoonFaction).includes(faction)) {
    reply(res, { ok: false, message: "Pick a faction." });
    return;
  }
  reply(res, lobby.join(id, faction));
});

router.post("/leave", (req, res) => {
  const id = playerOf(req);
  if (id) lobby.leave(id);
  res.json({ lobby: lobby.getState() });
});

router.post("/pick", (req, res) => {
  const id = playerOf(req);
  if (!id) {
    reply(res, { ok: false, message: "Missing player id." });
    return;
  }
  reply(res, lobby.pick(id, String(req.body?.soldierId ?? "")));
});

router.post("/unpick", (req, res) => {
  const id = playerOf(req);
  if (!id) {
    reply(res, { ok: false, message: "Missing player id." });
    return;
  }
  reply(res, lobby.unpick(id, String(req.body?.soldierId ?? "")));
});

router.post("/loadout", (req, res) => {
  const id = playerOf(req);
  if (!id) {
    reply(res, { ok: false, message: "Missing player id." });
    return;
  }
  reply(res, lobby.setLoadout(id, String(req.body?.soldierId ?? ""), req.body?.loadout));
});

router.post("/name", (req, res) => {
  const id = playerOf(req);
  if (!id) {
    reply(res, { ok: false, message: "Missing player id." });
    return;
  }
  reply(res, lobby.setName(id, String(req.body?.name ?? "")));
});

router.post("/ready", (req, res) => {
  const id = playerOf(req);
  if (!id) {
    reply(res, { ok: false, message: "Missing player id." });
    return;
  }
  reply(res, lobby.ready(id));
});

router.post("/landing", (req, res) => {
  const id = playerOf(req);
  if (!id) {
    reply(res, { ok: false, message: "Missing player id." });
    return;
  }
  reply(res, lobby.chooseLandingZone(id, String(req.body?.landingZoneId ?? "")));
});

// End the current match and open the lobby for a new one.
router.post("/rematch", (_req, res) => {
  reply(res, lobby.rematch());
});

router.post("/reset", (_req, res) => {
  lobby.reset();
  res.json({ lobby: lobby.getState() });
});

export default router;
