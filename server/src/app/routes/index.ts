import { Router } from "express";
import statusRoute from "./status";
import platoonsRoute from "./platoons";
import unitsRoute from "./units";
import gameRoute from "./game";
import actionsRoute from "./actions";
import lobbyRoute from "./lobby";

const router = Router();

router.use("/status", statusRoute);
router.use("/platoons", platoonsRoute);
router.use("/units", unitsRoute);
router.use("/game", gameRoute);
router.use("/actions", actionsRoute);
router.use("/lobby", lobbyRoute);

export default router;
