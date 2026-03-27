// api.ts — all communication between the frontend and backend here

const API_URL = "http://localhost:5000/api/game";

// Saves the current game state to the database
export const saveGame = async (username: string, state: object): Promise<void> => {
  try {
    await fetch(`${API_URL}/save`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username, state }),
    });
  } catch (err) {
    console.error("Failed to save game:", err);
  }
};

// Loads a previously saved game state from the database
export const loadGame = async (username: string): Promise<object | null> => {
  try {
    const res  = await fetch(`${API_URL}/load/${username}`);
    const data = await res.json();
    return data ?? null;
  } catch (err) {
    console.error("Failed to load game:", err);
    return null;
  }
};

// Checks if a username already has a saved game.
// Returns true if the player exists, false if they are new.
export const checkPlayerExists = async (username: string): Promise<boolean> => {
  try {
    const res  = await fetch(`${API_URL}/player/${username}`);
    const data = await res.json();
    return data.exists ?? false;
  } catch (err) {
    console.error("Failed to check player:", err);
    return false;
  }
};

// Saves the player's achievement unlocks and stats to the database.
// Called whenever an achievement is unlocked so badges are per-player.
export const saveAchievements = async (
  username:    string,
  unlockedIds: string[],
  stats:       object
): Promise<void> => {
  try {
    await fetch(`${API_URL}/achievements`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username, unlockedIds, stats }),
    });
  } catch (err) {
    console.error("Failed to save achievements:", err);
  }
};

// Loads the player's achievement unlocks and stats from the database.
// Returns null if no achievements saved yet.
export const loadAchievements = async (username: string): Promise<{
  unlockedIds: string[];
  stats:       object;
} | null> => {
  try {
    const res  = await fetch(`${API_URL}/achievements/${username}`);
    const data = await res.json();
    return data ?? null;
  } catch (err) {
    console.error("Failed to load achievements:", err);
    return null;
  }
};

// Logs a player decision to the database.
export const logChoice = async (
  username: string,
  decision: string,
  details?: object
): Promise<void> => {
  try {
    await fetch(`${API_URL}/choice`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username, decision, details }),
    });
  } catch (err) {
    console.error("Failed to log choice:", err);
  }
};

// Saves the final game outcome when a session ends.
export const saveOutcome = async (
  username:       string,
  result:         string,
  finalBalance:   number,
  seasonsPlayed:  number,
  coralHealth:    number,
  pollutionLevel: number,
  extinctSpecies: string[]
): Promise<void> => {
  try {
    await fetch(`${API_URL}/outcome`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        username,
        result,
        finalBalance,
        seasonsPlayed,
        coralHealth,
        pollutionLevel,
        extinctSpecies,
      }),
    });
  } catch (err) {
    console.error("Failed to save outcome:", err);
  }
};