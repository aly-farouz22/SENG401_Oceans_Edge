// api.ts — handles all communication between the frontend and the backend.
// These two functions are the only place in the codebase that know about
// the backend URL, keeping networking logic out of game files.

const API_URL = "http://localhost:5000/api/game";

// Sends the current game state to the backend to be saved in Supabase.
// Called when the player ends a season or closes the game.
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

// Fetches a previously saved game state from Supabase for the given username.
// Returns null if no saved game exists for that username.
export const loadGame = async (username: string): Promise<object | null> => {
  try {
    const res = await fetch(`${API_URL}/load/${username}`);
    const data = await res.json();
    return data ?? null;
  } catch (err) {
    console.error("Failed to load game:", err);
    return null;
  }
};