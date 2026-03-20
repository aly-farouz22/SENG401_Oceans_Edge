// GameContext.tsx — React context that acts as the bridge between
// the Phaser game engine and the React UI layer.
//
// It holds the player's username and saved game state, and exposes
// saveGame/loadGame so any component or scene can persist progress
// without knowing about the backend directly.

import React, { createContext, useContext, useState, useCallback } from "react";
import { saveGame, loadGame } from "../services/api";

interface GameContextType {
  username:     string;
  setUsername:  (name: string) => void;
  savedState:   object | null;
  save:         (state: object) => Promise<void>;
  load:         () => Promise<object | null>;
}

// Create the context with a default empty value
const GameContext = createContext<GameContextType>({
  username:    "",
  setUsername: () => {},
  savedState:  null,
  save:        async () => {},
  load:        async () => null,
});

// Provider wraps the whole app in App.tsx so any component can access context
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username,   setUsername]  = useState<string>("");
  const [savedState, setSavedState] = useState<object | null>(null);

  // Saves the current game state to the backend
  const save = useCallback(async (state: object) => {
    if (!username) return;
    await saveGame(username, state);
  }, [username]);

  // Loads the saved game state from the backend and stores it in context
  const load = useCallback(async (): Promise<object | null> => {
    if (!username) return null;
    const state = await loadGame(username);
    setSavedState(state);
    return state;
  }, [username]);

  return (
    <GameContext.Provider value={{ username, setUsername, savedState, save, load }}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook so components can access context with one line
export const useGame = () => useContext(GameContext);