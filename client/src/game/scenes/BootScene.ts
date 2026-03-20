import Phaser from "phaser";
import { loadGame } from "../../services/api";
import { AchievementManager } from "../achievements/AchievementManager";

export let currentUsername = "";

export default class BootScene extends Phaser.Scene {
  private loadComplete = false;
  private playButton: Phaser.GameObjects.Text | null = null;
  private usernameInput: Phaser.GameObjects.DOMElement | null = null;
  private usernameValue = "";

  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("boot_bg", "/assets/Boot_bg.png");
    this.load.image("boat",    "/assets/boat.png");

    this.load.on("complete", () => {
      this.loadComplete = true;
      this.createTitleScreen();
      this.showPlayButton();
    });
  }

  create() {
    AchievementManager.instance.init();
    if (this.loadComplete) {
      this.createTitleScreen();
      this.showPlayButton();
    }
  }

  private createTitleScreen() {
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;

    // ── Background sprite ─────────────────────────────────────────────────
    this.add.image(cx, cy, "boot_bg")
      .setDisplaySize(W, H)
      .setDepth(0);

    // ── Loading indicator ─────────────────────────────────────────────────
    this.add.text(cx, cy + 160, "Loading...", {
      fontSize:   "13px",
      color:      "#336677",
      fontFamily: "monospace",

    }).setOrigin(0.5).setName("loadingText").setDepth(1);
     this.add.text(cx, cy + 90, "UN Sustainable Development Goal 14", {
      fontSize:   "16px",
      color:      "#ffffff",
      fontFamily: "monospace",
    }).setOrigin(0.5);

    this.add.text(
      cx, cy + 48,
      "Manage your fishing community.\nBalance profit with ocean health.",
      {
        fontSize:   "15px",
        color:      "#ffffff",
        fontFamily: "monospace",
        align:      "center",
      }
    ).setOrigin(0.5);

  }

  private showPlayButton() {
    const cx = this.cameras.main.width  / 2;
    const cy = this.cameras.main.height / 2;

    const loadingText = this.children.getByName("loadingText") as Phaser.GameObjects.Text | null;
    if (loadingText) loadingText.setVisible(false);

    // ── Username label ────────────────────────────────────────────────────
    this.add.text(cx, cy + 110, "Enter your username:", {
      fontSize:   "14px",
      color:      "#a0e8ff",
      fontFamily: "monospace",
      stroke:     "#001122",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2);

    // ── Username input ────────────────────────────────────────────────────
    const inputEl = document.createElement("input");
    inputEl.type        = "text";
    inputEl.placeholder = "e.g. captain123";
    inputEl.maxLength   = 20;
    inputEl.style.cssText = `
      width: 220px;
      padding: 8px 12px;
      font-size: 16px;
      font-family: monospace;
      background: #001a2e;
      color: #a0e8ff;
      border: 2px solid #336677;
      border-radius: 4px;
      outline: none;
      text-align: center;
    `;

    this.usernameInput = this.add.dom(cx, cy + 140, inputEl).setDepth(10);

    inputEl.addEventListener("input", () => {
      this.usernameValue = inputEl.value.trim();
    });

    // ── Play button ───────────────────────────────────────────────────────
    this.playButton = this.add
      .text(cx, cy + 200, "▶  Click to Play", {
        fontSize:        "24px",
        fontStyle:       "bold",
        color:           "#44ffaa",
        fontFamily:      "monospace",
        stroke:          "#002211",
        strokeThickness: 4,
        backgroundColor: "#0a3322",
        padding:         { x: 32, y: 14 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(2)
      .setInteractive({ useHandCursor: true });

    this.playButton.on("pointerover", () => this.playButton?.setColor("#ffffff"));
    this.playButton.on("pointerout",  () => this.playButton?.setColor("#44ffaa"));
    this.playButton.on("pointerdown", async () => {
      if (!this.usernameValue) {
        inputEl.style.borderColor = "#ff4444";
        setTimeout(() => { inputEl.style.borderColor = "#336677"; }, 1000);
        return;
      }

      currentUsername = this.usernameValue;

      const saved = await loadGame(this.usernameValue);
      if (saved) {
        console.log("Saved game found for", this.usernameValue);
      }

      this.usernameInput?.destroy();
      this.tweens.killTweensOf(this.playButton!);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("MainScene");
      });
    });

    // Fade in then pulse
    this.tweens.add({
      targets:  this.playButton,
      alpha:    1,
      duration: 400,
      ease:     "Cubic.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets:  this.playButton,
          scaleX:   1.05,
          scaleY:   1.05,
          duration: 800,
          yoyo:     true,
          repeat:   -1,
          ease:     "Sine.easeInOut",
        });
      },
    });
  }
}