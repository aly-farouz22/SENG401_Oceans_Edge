import Phaser from "phaser";
import { checkPlayerExists, loadGame } from "../../services/api";
import { AchievementManager } from "../achievements/AchievementManager";

export let currentUsername = "";

export default class BootScene extends Phaser.Scene {
  private loadComplete = false;
  private playButton: Phaser.GameObjects.Text | null = null;
  private usernameInput: Phaser.GameObjects.DOMElement | null = null;
  private usernameValue = "";
  private inputEl: HTMLInputElement | null = null;

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
      fontSize:        "14px",
      color:           "#a0e8ff",
      fontFamily:      "monospace",
      stroke:          "#001122",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2).setName("usernameLabel");

    // ── Username input — stored as class field so we can remove it later ──
    this.inputEl = document.createElement("input");
    this.inputEl.type        = "text";
    this.inputEl.placeholder = "e.g. captain123";
    this.inputEl.maxLength   = 20;
    this.inputEl.style.cssText = `
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

    this.usernameInput = this.add.dom(cx, cy + 140, this.inputEl).setDepth(10);

    this.inputEl.addEventListener("input", () => {
      this.usernameValue = this.inputEl?.value.trim() ?? "";
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
        if (this.inputEl) this.inputEl.style.borderColor = "#ff4444";
        setTimeout(() => { if (this.inputEl) this.inputEl.style.borderColor = "#336677"; }, 1000);
        return;
      }

      currentUsername = this.usernameValue;

      await AchievementManager.instance.switchToDbStorage(currentUsername);

      const exists = await checkPlayerExists(currentUsername);

      if (exists) {
        this.showContinueOrNewGame();
      } else {
        this.clearLoginUI();
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("MainScene");
        });
      }
    });

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

  // ── Removes all login UI elements from both Phaser and the DOM ────────────
  private clearLoginUI() {
    // Remove the actual HTML input element
    if (this.inputEl) {
      this.inputEl.remove();
      this.inputEl = null;
    }

    // Remove Phaser's DOM container element entirely from the page
    const phaserDomContainer = document.getElementById("game-container")
      ?.querySelector("div[style*='position']");
    if (phaserDomContainer) {
      (phaserDomContainer as HTMLElement).style.display = "none";
    }

    this.usernameInput?.destroy();
    this.usernameInput = null;

    this.tweens.killTweensOf(this.playButton!);
    this.playButton?.destroy();
    this.playButton = null;

    const usernameLabel = this.children.getByName("usernameLabel") as Phaser.GameObjects.Text | null;
    if (usernameLabel) usernameLabel.destroy();
  }

  // ── Continue or New Game screen ───────────────────────────────────────────
  private showContinueOrNewGame() {
    const cx = this.cameras.main.width  / 2;
    const cy = this.cameras.main.height / 2;

    // Clear all login UI before showing choice buttons
    this.clearLoginUI();

    const label = this.add.text(cx, cy + 110, `Welcome back, ${currentUsername}!`, {
      fontSize:        "16px",
      color:           "#a0e8ff",
      fontFamily:      "monospace",
      stroke:          "#001122",
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0).setDepth(2);

    const btnContinue = this.add.text(cx - 90, cy + 145, "▶  Continue", {
      fontSize:        "18px",
      fontStyle:       "bold",
      color:           "#44ffaa",
      fontFamily:      "monospace",
      stroke:          "#002211",
      strokeThickness: 4,
      backgroundColor: "#0a3322",
      padding:         { x: 20, y: 12 },
    }).setOrigin(0.5).setAlpha(0).setDepth(2).setInteractive({ useHandCursor: true });

    const btnNew = this.add.text(cx + 90, cy + 145, "🔄  New Game", {
      fontSize:        "18px",
      fontStyle:       "bold",
      color:           "#ffaa44",
      fontFamily:      "monospace",
      stroke:          "#002211",
      strokeThickness: 4,
      backgroundColor: "#2a1a00",
      padding:         { x: 20, y: 12 },
    }).setOrigin(0.5).setAlpha(0).setDepth(2).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets:  [label, btnContinue, btnNew],
      alpha:    1,
      duration: 300,
      ease:     "Cubic.easeOut",
    });

    btnContinue.on("pointerover", () => btnContinue.setAlpha(0.75));
    btnContinue.on("pointerout",  () => btnContinue.setAlpha(1));
    btnContinue.on("pointerdown", async () => {
      const saved = await loadGame(currentUsername);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("MainScene", { savedState: saved });
      });
    });

    btnNew.on("pointerover", () => btnNew.setAlpha(0.75));
    btnNew.on("pointerout",  () => btnNew.setAlpha(1));
    btnNew.on("pointerdown", async () => {
      await AchievementManager.instance.reset();
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("MainScene");
      });
    });
  }
}