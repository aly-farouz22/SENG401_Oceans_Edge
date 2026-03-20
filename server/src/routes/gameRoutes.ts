import { Router } from "express";
import { saveGame, loadGame, recordChoice, recordOutcome } from "../controllers/gameController";

const router = Router();

// Save and load game state
router.post("/save",              saveGame);
router.get("/load/:username",     loadGame);

// Log a player decision
router.post("/choice",            recordChoice);

// Save final game outcome
router.post("/outcome",           recordOutcome);

export default router;