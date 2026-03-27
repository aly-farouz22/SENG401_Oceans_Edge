import Phaser from "phaser";
import BadgeGalleryScreen from "../achievements/BadgeGalleryScreen";
import { currentUsername } from "../scenes/BootScene";
import { saveGame, loadGame } from "../../services/api";
import { AchievementManager } from "../achievements/AchievementManager";

const PLAYER_ID = "player_1";

export default class PauseMenu {
  private scene:     Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private isOpen     = false;

  public onResume?:     () => void;
  public onExitToMenu?: () => void;
  public onQuit?:       () => void;

  public getGameState?: () => object;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.scene.physics.pause();

    const W  = this.scene.cameras.main.width;
    const H  = this.scene.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;
    const PW = 340;
    const PH = 480; // taller to fit extra button
    const DEPTH = 500;

    const overlay = this.scene.add.rectangle(cx, cy, W, H, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(DEPTH);

    const panel = this.scene.add.rectangle(cx, cy, PW, PH, 0x001a2e, 1)
      .setScrollFactor(0).setDepth(DEPTH + 1);

    const border = this.scene.add.rectangle(cx, cy, PW, PH)
      .setStrokeStyle(3, 0xffffff, 0.3).setFillStyle(0, 0)
      .setScrollFactor(0).setDepth(DEPTH + 2);

    const title = this.scene.add.text(cx, cy - PH / 2 + 30, "⏸ Paused", {
      fontSize: "24px", fontStyle: "bold", color: "#ffffff",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3);

    const divider = this.scene.add.rectangle(cx, cy - PH / 2 + 58, PW - 40, 1, 0xffffff, 0.2)
      .setScrollFactor(0).setDepth(DEPTH + 3);

    const saveStatus = this.scene.add.text(cx, cy - 100, "", {
      fontSize: "12px", color: "#44ff88",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3);

    const btnResume = this.makeButton(cx, cy - 60,  "▶  Resume",        "#44ff88", DEPTH + 3);
    const btnBadges = this.makeButton(cx, cy + 5,  "🏅  Badges",        "#ffcc44", DEPTH + 3);
    const btnSave   = this.makeButton(cx, cy + 70,  "💾  Save Game",     "#66ccff", DEPTH + 3);
    const btnLoad   = this.makeButton(cx, cy + 135, "📂  Load Game",   "#66ffcc", DEPTH + 3);
    const btnExit   = this.makeButton(cx, cy + 200, "🏠  Exit to Menu",  "#ffaa44", DEPTH + 3);
    const btnQuit   = this.makeButton(cx, cy + 265, "✖  Quit Game",      "#ff6666", DEPTH + 3);

    // Resume
    btnResume.on("pointerdown", () => {
      this.close();
      this.onResume?.();
    });

    // Badges
    btnBadges.on("pointerdown", () => {
      this.close();
      const gallery = new BadgeGalleryScreen(this.scene);
      gallery.onClose = () => {
        // Reopen pause menu when gallery is closed
        this.scene.time.delayedCall(100, () => this.open());
      };
      gallery.show();
    });

    // Save button
    btnSave.on("pointerdown", async () => {
      if (!currentUsername) {
        saveStatus.setColor("#ff4444").setText("❌ No username set");
        this.scene.time.delayedCall(2000, () => saveStatus.setText(""));
        return;
      }

      saveStatus.setColor("#66ffcc").setText("💾 Saving game...");

      const gameState = this.getGameState?.() ?? {};

      try {
        await saveGame(currentUsername, gameState);
        saveStatus.setColor("#44ff88").setText("✅ Game saved!");
      } catch {
        saveStatus.setColor("#ff4444").setText("❌ Error saving game");
      }

      this.scene.time.delayedCall(2000, () => saveStatus.setText(""));
    });

    // Load button
    btnLoad.on("pointerdown", async () => {
      if (!currentUsername) {
        saveStatus.setColor("#ff4444").setText("❌ No username set");
        this.scene.time.delayedCall(2000, () => saveStatus.setText(""));
        return;
      }

      saveStatus.setColor("#66ffcc").setText("📂 Loading saves...");

      try {
        const saved = await loadGame(currentUsername);
        if (saved) {
          saveStatus.setColor("#44ff88").setText("✅ Save found!");
          this.scene.events.emit("loadGameState", saved);
        } else {
          saveStatus.setColor("#ff4444").setText("❌ No saves found");
        }
      } catch {
        saveStatus.setColor("#ff4444").setText("❌ Failed to fetch saves");
      }

      this.scene.time.delayedCall(2000, () => saveStatus.setText(""));
    });

    // Exit to BootScene
    btnExit.on("pointerdown", () => {
      this.scene.cameras.main.fadeOut(400, 0, 0, 0);
      this.scene.cameras.main.once("camerafadeoutcomplete", () => {
        window.location.reload();
      });
    });

    // Quit
    btnQuit.on("pointerdown", () => {
      window.close();
      document.body.innerHTML = "<div style='color:white;font-family:monospace;padding:40px;font-size:24px'>Thanks for playing! You can close this tab.</div>";
    });

    // ESC to resume
    this.scene.input.keyboard!.once("keydown-ESC", () => {
      this.close();
      this.onResume?.();
    });

    const all = [overlay, panel, border, title, divider, saveStatus,
                 btnResume, btnBadges, btnSave, btnLoad, btnExit, btnQuit];

    this.container = this.scene.add.container(0, 0, all).setDepth(DEPTH);

    all.forEach(o => o.setAlpha(0));
    this.scene.tweens.add({
      targets: all, alpha: 1, duration: 200, ease: "Cubic.easeOut",
    });
  }

  private makeButton(x: number, y: number, label: string, color: string, depth: number) {
    return this.scene.add.text(x, y, label, {
      fontSize: "16px", color, fontFamily: "monospace",
      stroke: "#000", strokeThickness: 3,
      backgroundColor: "#0a2a3a", padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth)
      .setInteractive({ useHandCursor: true })
      .on("pointerover",  function(this: Phaser.GameObjects.Text) { this.setAlpha(0.75); })
      .on("pointerout",   function(this: Phaser.GameObjects.Text) { this.setAlpha(1); });
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.scene.physics.resume();

    if (!this.container) return;
    this.scene.tweens.add({
      targets: this.container.list,
      alpha: 0, duration: 150,
      onComplete: () => { this.container?.destroy(); this.container = null; },
    });
  }
}