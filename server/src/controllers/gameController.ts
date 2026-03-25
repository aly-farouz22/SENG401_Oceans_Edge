import { Request, Response } from "express";
import {
  saveGameState,
  loadGameState,
  logChoice,
  saveOutcome,
  playerExists,
  saveAchievements,
  loadAchievements,
} from "../services/gameService";

// Saves the current game state for a player
export const saveGame = async (req: Request, res: Response) => {
  const data = req.body;
  const result = await saveGameState(data);
  res.json(result);
};

// Loads the saved game state for a player by username
export const loadGame = async (req: Request<{ username: string }>, res: Response) => {
  const { username } = req.params;
  const result = await loadGameState(username);
  res.json(result);
};

// Logs a single player decision to the Choice table
export const recordChoice = async (req: Request, res: Response) => {
  const data = req.body;
  const result = await logChoice(data);
  res.json(result);
};

// Saves the final game outcome when a session ends
export const recordOutcome = async (req: Request, res: Response) => {
  const data = req.body;
  const result = await saveOutcome(data);
  res.json(result);
};

// Checks if a username already has a saved game — used by BootScene
// to decide whether to show "Continue" or start fresh
export const checkPlayer = async (req: Request<{ username: string }>, res: Response) => {
  const { username } = req.params;
  const exists = await playerExists(username);
  res.json({ exists });
};

// Saves achievement unlocks and stats for a specific player
export const savePlayerAchievements = async (req: Request, res: Response) => {
  const data = req.body;
  const result = await saveAchievements(data);
  res.json(result);
};

// Loads achievement unlocks and stats for a specific player
export const loadPlayerAchievements = async (
  req: Request<{ username: string }>,
  res: Response
) => {
  const { username } = req.params;
  const result = await loadAchievements(username);
  res.json(result ?? { unlockedIds: [], stats: {} });
};