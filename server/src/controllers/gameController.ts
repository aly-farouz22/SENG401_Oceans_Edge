import { Request, Response } from "express";
import { saveGameState, loadGameState, logChoice, saveOutcome } from "../services/gameService";

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
// Body: { username, decision, details? }
export const recordChoice = async (req: Request, res: Response) => {
  const data = req.body;
  const result = await logChoice(data);
  res.json(result);
};

// Saves the final game outcome when a session ends
// Body: { username, result, finalBalance, seasonsPlayed, coralHealth, pollutionLevel, extinctSpecies }
export const recordOutcome = async (req: Request, res: Response) => {
  const data = req.body;
  const result = await saveOutcome(data);
  res.json(result);
};