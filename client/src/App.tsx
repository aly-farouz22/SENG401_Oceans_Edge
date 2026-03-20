import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import { gameConfig } from "./game/config";
import Dashboard from "./components/Dashboard";
import { GameProvider } from "./context/GameContext";

const App: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Only create the Phaser game once — useEffect runs twice in React
    // StrictMode (development only), so the useRef check prevents a
    // second Phaser instance from being created on the second run.
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(gameConfig);
    }

    // Cleanup: destroy the Phaser game if the App component unmounts.
    // This matters during development with hot reload.
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    // Outer wrapper: full viewport height, side-by-side layout
    <div style={{ display: "flex", height: "100vh", margin: 0, padding: 0 }}>

      {/* game-container must have explicit width and height — Phaser
          sizes its canvas to match this div. Without dimensions the
          canvas renders into a 0x0 box and you just see black. */}
      <div
        id="game-container"
        style={{
          width:    "1024px",
          height:   "768px",
          flexShrink: 0,        // prevent flex from squishing the canvas
        }}
      />

      {/* Dashboard sits to the right of the game canvas */}
      <Dashboard />
    </div>
  );
};

export default App;