import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  // Tracks whether all assets have finished loading
  private loadComplete = false;

  // The play button — kept as a reference so we can animate it
  private playButton: Phaser.GameObjects.Text | null = null;

  constructor() {
    super("BootScene");
  }

  preload() {
    // Draw the title screen first so there is no black flash while loading
    this.createTitleScreen();

    // ── Load all game assets ──────────────────────────────────────────────
    // Add new assets here as the project grows.
    this.load.image("boat", "/assets/boat.png");

    // When all assets finish loading, show the play button
    this.load.on("complete", () => {
      this.loadComplete = true;
      this.showPlayButton();
    });
  }

  create() {
    if (this.loadComplete) {
      this.showPlayButton();
    }
  }

  /**
   * Builds the static title screen elements.
   * Called at the very start of preload() so something is visible
   * immediately while assets load in the background.
   */
  private createTitleScreen() {
    const cx = this.cameras.main.width  / 2;
    const cy = this.cameras.main.height / 2;

    this.cameras.main.setBackgroundColor("#0a3d6b");

    this.add.ellipse(cx, cy + 260,  900, 120, 0x0d5a9e, 0.3);
    this.add.ellipse(cx, cy + 290, 1100, 130, 0x0a4a8a, 0.2);
    this.add.ellipse(cx, cy + 310, 1300, 140, 0x082d5e, 0.15);

    // ── Game title ────────────────────────────────────────────────────────
    this.add.text(cx, cy - 160, "🌊 Ocean's Edge", {
      fontSize:        "52px",
      fontStyle:       "bold",
      color:           "#a0e8ff",
      fontFamily:      "monospace",
      stroke:          "#002233",
      strokeThickness: 8,
    }).setOrigin(0.5);

    // ── SDG 14 label ──────────────────────────────────────────────────────
    this.add.text(cx, cy - 90, "UN Sustainable Development Goal 14", {
      fontSize:   "16px",
      color:      "#4a9aaa",
      fontFamily: "monospace",
    }).setOrigin(0.5);

    // ── Short description ─────────────────────────────────────────────────
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

    // ── Loading indicator — hidden once assets finish ─────────────────────
    this.add.text(cx, cy + 160, "Loading...", {
      fontSize:   "13px",
      color:      "#336677",
      fontFamily: "monospace",
    }).setOrigin(0.5).setName("loadingText");
  }

  /**
   * Replaces the "Loading..." text with an interactive "Click to Play" button.
   * The click counts as a user gesture so Web Audio is allowed to start.
   */
  private showPlayButton() {
    const cx = this.cameras.main.width  / 2;
    const cy = this.cameras.main.height / 2;

    // Hide the loading label
    const loadingText = this.children.getByName(
      "loadingText"
    ) as Phaser.GameObjects.Text | null;
    if (loadingText) loadingText.setVisible(false);

    // ── Play button ───────────────────────────────────────────────────────
    this.playButton = this.add
      .text(cx, cy + 100, "▶  Click to Play", {
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

    // Hover: brighten on pointer over, restore on pointer out
    this.playButton.on("pointerover", () => {
      this.playButton?.setColor("#ffffff");
    });
    this.playButton.on("pointerout", () => {
      this.playButton?.setColor("#44ffaa");
    });

    // Click: fade the camera to black then start MainScene
    this.playButton.on("pointerdown", () => {
      // Stop the pulse animation so it doesn't fight the fade
      this.tweens.killTweensOf(this.playButton!);

      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("MainScene");
      });
    });

    // Fade the button in first, then start the pulse loop
    this.tweens.add({
      targets:  this.playButton,
      alpha:    1,
      duration: 400,
      ease:     "Cubic.easeOut",
      onComplete: () => {
        // Gentle pulse to draw the player's eye to the button
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