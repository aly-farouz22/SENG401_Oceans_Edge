import { Request, Response } from "express";
import { saveGameState, loadGameState } from "../services/gameService";

export const saveGame = async (req: Request, res: Response) => {
  const data = req.body;
  const result = await saveGameState(data);
  res.json(result);
};

export const loadGame = async (req: Request, res: Response) => {
  const { playerId } = req.params;
  const result = await loadGameState(playerId);
  res.json(result);
};