import Phaser from "phaser";
import { loadGame } from "../../services/api";
import { currentUsername } from "./BootScene";

export default class MenuScene extends Phaser.Scene {
  private errorText!: Phaser.GameObjects.Text;

  constructor() {
    super("MenuScene");
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;

    this.add.image(cx, cy, "boot_bg")
      .setDisplaySize(W, H)
      .setDepth(0);

    this.add.text(cx, cy - 140, "OCEAN'S EDGE", {
      fontSize: "40px",
      fontStyle: "bold",
      color: "#66ffcc",
      fontFamily: "monospace",
      stroke: "#003333",
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 85, `Captain: ${currentUsername}`, {
      fontSize: "16px",
      color: "#ffffff",
      fontFamily: "monospace",
      stroke: "#001122",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.errorText = this.add.text(cx, cy + 135, "", {
      fontSize: "14px",
      color: "#ff6655",
      fontFamily: "monospace",
      stroke: "#220000",
      strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false);

    const newBtn = this.makeButton(cx, cy, "NEW GAME");
    newBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("IntroScene");
      });
    });

    const loadBtn = this.makeButton(cx, cy + 70, "LOAD GAME", "#66ddff");
    loadBtn.on("pointerdown", async () => {
      if (!currentUsername) {
        this.showError("No username found. Please restart.");
        return;
      }

      const saved = await loadGame(currentUsername);

      if (!saved) {
        this.showError("No save found. Start a new game.");
        return;
      }

      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("MainScene", { savedGame: saved });
      });
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    color = "#44ffaa"
  ) {
    const btn = this.add.text(x, y, label, {
      fontSize: "24px",
      fontStyle: "bold",
      color,
      fontFamily: "monospace",
      stroke: "#002211",
      strokeThickness: 4,
      padding: { x: 18, y: 10 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.setShadow(0, 0, color, 8, true, true);

    btn.on("pointerover", () => {
      btn.setColor("#ffffff");
      this.tweens.add({
        targets: btn,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 120,
        ease: "Cubic.easeOut",
      });
    });

    btn.on("pointerout", () => {
      btn.setColor(color);
      this.tweens.add({
        targets: btn,
        scaleX: 1,
        scaleY: 1,
        duration: 120,
        ease: "Cubic.easeOut",
      });
    });

    return btn;
  }

  private showError(msg: string) {
    this.errorText.setText(msg).setVisible(true);
  }
}