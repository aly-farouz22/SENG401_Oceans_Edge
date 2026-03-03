import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import { gameConfig } from "./game/config";
import Dashboard from "./components/Dashboard";

const App: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(gameConfig);
    }
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <div id="game-container" />
      <Dashboard />
    </div>
  );
};

export default App;