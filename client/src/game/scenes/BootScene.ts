import Phaser from "phaser";
import { AchievementManager } from "../achievements/AchievementManager";
import BadgeGalleryScreen from "../achievements/BadgeGalleryScreen";

export default class BootScene extends Phaser.Scene {
  private loadComplete = false;
  private playButton: Phaser.GameObjects.Text | null = null;

  constructor() {
    super("BootScene");
  }

  preload() {
    this.createTitleScreen();

    this.load.image("boat", "/assets/boat.png");

    this.load.on("complete", () => {
      this.loadComplete = true;
      this.showPlayButton();
    });
  }

  create() {
    // Init achievements so the gallery works from the boot screen too
    AchievementManager.instance.init();

    if (this.loadComplete) {
      this.showPlayButton();
    }
  }

  private createTitleScreen() {
    const cx = this.cameras.main.width  / 2;
    const cy = this.cameras.main.height / 2;

    this.cameras.main.setBackgroundColor("#0a3d6b");

    this.add.ellipse(cx, cy + 260,  900, 120, 0x0d5a9e, 0.3);
    this.add.ellipse(cx, cy + 290, 1100, 130, 0x0a4a8a, 0.2);
    this.add.ellipse(cx, cy + 310, 1300, 140, 0x082d5e, 0.15);

    this.add.text(cx, cy - 160, "🌊 Ocean's Edge", {
      fontSize:        "52px",
      fontStyle:       "bold",
      color:           "#a0e8ff",
      fontFamily:      "monospace",
      stroke:          "#002233",
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 90, "UN Sustainable Development Goal 14", {
      fontSize:   "16px",
      color:      "#4a9aaa",
      fontFamily: "monospace",
    }).setOrigin(0.5);

    this.add.text(
      cx, cy - 48,
      "Manage your fishing community.\nBalance profit with ocean health.",
      {
        fontSize:   "15px",
        color:      "#88bbcc",
        fontFamily: "monospace",
        align:      "center",
      }
    ).setOrigin(0.5);

    this.add.text(cx, cy + 160, "Loading...", {
      fontSize:   "13px",
      color:      "#336677",
      fontFamily: "monospace",
    }).setOrigin(0.5).setName("loadingText");
  }

  private showPlayButton() {
    const cx = this.cameras.main.width  / 2;
    const cy = this.cameras.main.height / 2;

    const loadingText = this.children.getByName("loadingText") as Phaser.GameObjects.Text | null;
    if (loadingText) loadingText.setVisible(false);

    // ── Play button ───────────────────────────────────────────────────────
    this.playButton = this.add
      .text(cx, cy + 80, "▶  Click to Play", {
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
      .setInteractive({ useHandCursor: true });

    this.playButton.on("pointerover", () => this.playButton?.setColor("#ffffff"));
    this.playButton.on("pointerout",  () => this.playButton?.setColor("#44ffaa"));
    this.playButton.on("pointerdown", () => {
      this.tweens.killTweensOf(this.playButton!);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("MainScene");
      });
    });

    // ── Badges button ─────────────────────────────────────────────────────
    const badgesBtn = this.add
      .text(cx, cy + 150, "🏅  View Badges", {
        fontSize:        "16px",
        color:           "#ffcc44",
        fontFamily:      "monospace",
        stroke:          "#002211",
        strokeThickness: 3,
        backgroundColor: "#0a2a3a",
        padding:         { x: 24, y: 10 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });

    badgesBtn.on("pointerover", () => badgesBtn.setAlpha(0.75));
    badgesBtn.on("pointerout",  () => badgesBtn.setAlpha(1));
    badgesBtn.on("pointerdown", () => {
      const gallery = new BadgeGalleryScreen(this);
      gallery.onClose = () => {}; // just close, stay on boot screen
      gallery.show();
    });

    // Fade both buttons in then pulse play button
    this.tweens.add({
      targets:  [this.playButton, badgesBtn],
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