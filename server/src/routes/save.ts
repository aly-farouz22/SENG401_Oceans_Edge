
import express from "express";
import { prisma } from "../prismaClient";
const router = express.Router();

router.post("/save", async (req, res) => {
    const { userId, name, data } = req.body;
    try {
        const save = await prisma.gameSave.upsert({
            where: { userId_name: { userId, name } },
            update: { data },
            create: { userId, name, data },
        });
        res.json({ success: true, save });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to save game." });
    }
});

export default router;