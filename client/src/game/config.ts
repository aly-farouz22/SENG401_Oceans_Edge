import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import MainScene from "./scenes/MainScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: "game-container",
  dom: {
    createContainer: true,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false }
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  scene: [BootScene, MainScene]
};