import { Router } from "express";
import { saveGame, loadGame, recordChoice, recordOutcome } from "../controllers/gameController";
import prisma from "../prisma";

const router = Router();

// Save and load game state
router.post("/save",              saveGame);
router.get("/load/:username",     loadGame);

// Log a player decision
router.post("/choice",            recordChoice);

// Save final game outcome
router.post("/outcome",           recordOutcome);

// GET all saves for a player
router.get("/saves/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
  
      const saves = await prisma.save.findMany({
        where: { playerId },
        orderBy: { createdAt: "desc" }
      });
  
      res.json({
        success: true,
        saves
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch saves"
      });
    }
  });

// Save
router.post("/save", async (req, res) => {
    try {
      const { playerId, gameState } = req.body;
  
      if (!playerId || !gameState) {
        return res.status(400).json({ success: false, message: "Missing data" });
      }
  
      const save = await prisma.save.create({
        data: {
          playerId,
          data: gameState
        }
      });
  
      res.json({ success: true, save });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to save game" });
    }
  });

export default router;