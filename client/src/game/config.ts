import Phaser from "phaser";
import MainScene from "./scenes/MainScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: { debug: false }
  },
  scene: [MainScene]
};