import Phaser from "phaser";
import BootScene from "./game/scenes/BootScene";
import HomeScene from "./game/scenes/HomeScene";
import IntroScene from "./game/scenes/IntroScene";
import LoginScene from "./game/scenes/LoginScene";
import MainScene from "./game/scenes/MainScene";
import MenuScene from "./game/scenes/MenuScene";
import TutorialScene from "./game/scenes/TutorialScene";

const config: Phaser.Types.Core.GameConfig = {
  type:            Phaser.AUTO,
  backgroundColor: "#000d1a",
  parent:          "root",
  scale: {
    mode:       Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true,
  },
  physics: {
    default: "arcade",
    arcade:  { gravity: { x: 0, y: 0 }, debug: false },
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  scene: [
    BootScene,
    LoginScene,
    HomeScene,
    MenuScene,
    IntroScene,
    TutorialScene,
    MainScene,
  ],
};
new Phaser.Game(config);