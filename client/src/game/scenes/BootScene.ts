import Phaser from "phaser";
import { AchievementManager } from "../achievements/AchievementManager";

export let currentUsername = "";

export function setCurrentUsername(name: string) {
  currentUsername = name;
}

export default class BootScene extends Phaser.Scene {
  private playButton: Phaser.GameObjects.Text | null = null;

  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("boot_bg", "/assets/Boot_bg.png");
    this.load.image("boat", "/assets/Boat.png");
    this.load.image("fish_anchovy", "/assets/Anchovy_Sprat_Common.png");
    this.load.image("fish_aurora", "/assets/Aurora_Trout_Endangered.png");
    this.load.image("fish_crab", "/assets/European_Green_Crab_Invasive.png");
    this.load.image("fish_haddock", "/assets/Haddock_Common.png");
    this.load.image("fish_lionfish", "/assets/Lionfish_Invasive.png");
    this.load.image("fish_swordfish", "/assets/North_Atlantic_Swordfish_Common.png");
    this.load.image("fish_opah", "/assets/Opah_Fish_Common.png");
    this.load.image("fish_halibut", "/assets/Pacific_Halibut_Common.png");
    this.load.image("fish_snapper", "/assets/Red_Snapper_Common.png");
    this.load.image("fish_bluefin", "/assets/Southern_Bluefin_Tuna_Endangered.png");
    this.load.image("upgrade_fuel", "/assets/Fuel_Upgrade.png");
    this.load.image("upgrade_net", "/assets/Net_Upgrade.png");
    this.load.image("trash_bottle", "/assets/Water_Bottle_Trash.png");
    this.load.image("trash_cigarette", "/assets/Cigarette_Buds_Trash.png");
    this.load.image("payment_bg", "/assets/Payment.png");
    this.load.image("ocean_bg", "/assets/Ocean_bg.png");
    this.load.image("market_dock", "/assets/Harbour.png");
    this.load.image("fishing_zone", "/assets/FishingZone.png");
    this.load.image("ui_bar", "/assets/UI.png");
    this.load.image("fuel_bar", "/assets/FuelBar.png");
    this.load.image("pause_btn", "/assets/Pause.png");
    this.load.image("collection_bg", "/assets/Collection.png");
    this.load.image("compass", "/assets/Compass.png");
  }

  create() {
    AchievementManager.instance.init();

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;

    // Background 
    this.add.image(cx, cy, "boot_bg")
      .setDisplaySize(W, H)
      .setDepth(0);

    // Title
    this.add.text(cx, cy - 60, "OCEAN'S EDGE", {
      fontSize: "44px",
      fontStyle: "bold",
      color: "#44ffaa",
      fontFamily: "monospace",
      stroke: "#002211",
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, cy + 10, "SENG 401 Project – Group 3", {
      fontSize: "18px",
      color: "#ffffff",
      fontFamily: "monospace",
    }).setOrigin(0.5);

    // Play button
    this.playButton = this.add.text(cx, cy + 100, "▶ Click to Play", {
      fontSize: "26px",
      fontStyle: "bold",
      color: "#44ffaa",
      fontFamily: "monospace",
      stroke: "#002211",
      strokeThickness: 4,
      backgroundColor: "#0a3322",
      padding: { x: 32, y: 14 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.playButton.on("pointerover", () => this.playButton?.setColor("#ffffff"));
    this.playButton.on("pointerout", () => this.playButton?.setColor("#44ffaa"));

    this.playButton.on("pointerdown", () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LoginScene");
      });
    });

    // Smooth fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // pulse animation
    this.tweens.add({
      targets: this.playButton,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}