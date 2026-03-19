// path: server/routes/game.ts
import express from "express";
import { prisma } from "../prisma"; // adjust this path to where your Prisma client is

const router = express.Router();

/**
 * Load a saved game by userId and save name
 */
router.get("/load/:userId/:name", async (req, res) => {
    const { userId, name } = req.params;
    try {
        const save = await prisma.gameSave.findUnique({
            where: { userId_name: { userId, name } } // composite unique: userId + name
        });
        if (!save) return res.status(404).json({ success: false, error: "Save not found" });
        res.json({ success: true, data: save.data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to load game." });
    }
});

/**
 * Save current game state for a user
 */
router.post("/save", async (req, res) => {
    const { userId, name, data } = req.body;
    try {
        const save = await prisma.gameSave.upsert({
            where: { userId_name: { userId, name } },
            update: { data },
            create: { userId, name, data }
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to save game." });
    }
});

export default router;