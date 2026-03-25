import { Router } from "express";
import {
  saveGame,
  loadGame,
  recordChoice,
  recordOutcome,
  checkPlayer,
  savePlayerAchievements,
  loadPlayerAchievements,
} from "../controllers/gameController";

const router = Router();

// Check if a username already exists — used by BootScene to show Continue vs New Game
router.get("/player/:username",              checkPlayer);

// Save and load game state
router.post("/save",                         saveGame);
router.get("/load/:username",                loadGame);

// Log a player decision
router.post("/choice",                       recordChoice);

// Save final game outcome
router.post("/outcome",                      recordOutcome);

// Save and load per-player achievements
router.post("/achievements",                 savePlayerAchievements);
router.get("/achievements/:username",        loadPlayerAchievements);

export default router;