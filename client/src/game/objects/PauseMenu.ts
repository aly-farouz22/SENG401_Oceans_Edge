import Phaser from "phaser";
import BadgeGalleryScreen from "../achievements/BadgeGalleryScreen";

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
      saveStatus.setColor("#66ffcc").setText("💾 Saving game...");

      const gameState = getGameState(); // function that returns JSON of current state

      try {
        const res = await fetch("/api/game/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: PLAYER_ID, gameState })
        });
        const data = await res.json();

        if (data.success) {
          saveStatus.setText("✅ Game saved!");
        } else {
          saveStatus.setText("❌ Failed to save");
        }
      } catch {
        saveStatus.setText("❌ Error saving game");
      }

      this.scene.time.delayedCall(2000, () => saveStatus.setText(""));
    });
    // Load
    btnLoad.on("pointerdown", async () => {
      saveStatus.setColor("#66ffcc").setText("📂 Loading saves...");
      try {
        const res = await fetch(`/api/game/saves/${PLAYER_ID}`);
        const data = await res.json();
        if (data.success && data.saves.length > 0) {
          this.showLoadModal(data.saves); // show modal to pick save
        } else {
          saveStatus.setText("❌ No saves found");
          this.scene.time.delayedCall(2000, () => saveStatus.setText(""));
        }
      } catch {
        saveStatus.setText("❌ Failed to fetch saves");
        this.scene.time.delayedCall(2000, () => saveStatus.setText(""));
      }
    });

    // Exit to BootScene
    btnExit.on("pointerdown", () => {
      this.scene.physics.resume();
      this.scene.cameras.main.fadeOut(400, 0, 0, 0);
      this.scene.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.scene.start("BootScene");
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
                 btnResume, btnBadges, btnSave, btnExit, btnQuit];

    this.container = this.scene.add.container(0, 0, all).setDepth(DEPTH);

    all.forEach(o => o.setAlpha(0));
    this.scene.tweens.add({
      targets: all, alpha: 1, duration: 200, ease: "Cubic.easeOut",
    });
  }
  
  private showLoadModal(saves: any[]) {
    const scene = this.scene;
    const W = scene.cameras.main.width;
    const H = scene.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;
    const DEPTH = 600;

    const overlay = scene.add.rectangle(cx, cy, W, H, 0x000000, 0.8)
      .setScrollFactor(0).setDepth(DEPTH)
      .setInteractive({ useHandCursor: true });
    
    const panel = scene.add.rectangle(cx, cy, 360, 400, 0x002233, 1)
      .setScrollFactor(0).setDepth(DEPTH + 1);

    const closeBtn = scene.add.text(cx, cy + 180, "✖ Close", {
      fontSize: "16px", fontFamily: "monospace",
      color: "#ff6666", backgroundColor: "#001a2e",
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(DEPTH + 2)
      .setInteractive({ useHandCursor: true });

    closeBtn.on("pointerdown", () => {
      overlay.destroy();
      panel.destroy();
      closeBtn.destroy();
      listTexts.forEach(t => t.destroy());
    });

    const listTexts: Phaser.GameObjects.Text[] = [];
    saves.forEach((save, i) => {
      const t = scene.add.text(cx, cy - 160 + i * 40, `⏱ ${new Date(save.createdAt).toLocaleString()}`, {
        fontSize: "14px", fontFamily: "monospace",
        color: "#44ffcc", backgroundColor: "#001a2e",
        padding: { x: 10, y: 6 }
      }).setOrigin(0.5).setDepth(DEPTH + 2)
        .setInteractive({ useHandCursor: true });

      t.on("pointerdown", () => {
        this.close();
        fetch("/api/game/load/" + PLAYER_ID)
          .then(res => res.json())
          .then(data => {
            if (this.getGameState) {
              this.getGameState(); // could pass data to MainScene.applySavedGame
              // Implement your MainScene.applySavedGame call here
              scene.events.emit("loadGameState", data);
            }
          });
      });
      listTexts.push(t);
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
  applySave(data: any) {
    // Example — update player position and inventory
    player.x = data.player.x;
    player.y = data.player.y;
    player.health = data.player.health;
  
    boat.inventory = data.boat.inventory;
  
    // Switch to the saved scene if different
    if (this.scene.scene.key !== data.scene) {
      this.scene.scene.start(data.scene);
    }
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