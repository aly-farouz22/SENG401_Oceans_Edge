import { Router } from "express";
import { saveGame, loadGame } from "../controllers/gameController";

const router = Router();

router.post("/save", saveGame);
router.get("/load/:playerId", loadGame);

export default router;