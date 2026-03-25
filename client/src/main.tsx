import Phaser from "phaser";
import BootScene     from "./game/scenes/BootScene";
import LoginScene    from "./game/scenes/LoginScene";
import HomeScene     from "./game/scenes/HomeScene";
import MenuScene     from "./game/scenes/MenuScene";
import IntroScene    from "./game/scenes/IntroScene";
import TutorialScene from "./game/scenes/TutorialScene";
import MainScene     from "./game/scenes/MainScene";

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