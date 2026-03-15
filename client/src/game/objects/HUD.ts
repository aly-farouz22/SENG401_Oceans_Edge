import Phaser from "phaser";
import { EcosystemState } from "../systems/EcosystemSystem"; // acidityLevel, pollutionLevel, coralHealth, fishPopulations
import { FishCatch } from "./FishingZone";

export default class HUD {
  private scene: Phaser.Scene;
  private moneyText:     Phaser.GameObjects.Text;
  private seasonText:    Phaser.GameObjects.Text;
  private inventoryText: Phaser.GameObjects.Text;
  private sellFeedback:  Phaser.GameObjects.Text;
  private panel:         Phaser.GameObjects.Rectangle;
  private ecosystemText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const px = 12;
    const py = 12;

    this.panel = scene.add
      .rectangle(px + 90, py + 44, 500, 120, 0x001a2e, 0.75)
      .setScrollFactor(0).setDepth(20);

    this.moneyText = scene.add.text(px, py, "💰 $0", {
      fontSize: "18px", color: "#ffdd44", fontStyle: "bold",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 3,
    }).setScrollFactor(0).setDepth(21);

    this.inventoryText = scene.add.text(px, py + 30, "🐟 Inventory: empty", {
      fontSize: "13px", color: "#a0e8ff",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
    }).setScrollFactor(0).setDepth(21);

    this.seasonText = scene.add.text(px, py + 56, "🌿 Season 1 — Spring", {
      fontSize: "13px", color: "#aaffcc",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
    }).setScrollFactor(0).setDepth(21);

    this.ecosystemText = scene.add.text(px, py + 80, "🌊 Ecosystem: Healthy", {
      fontSize: "13px", color: "#a0ffaa",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
    }).setScrollFactor(0).setDepth(21);

    this.sellFeedback = scene.add.text(
      scene.cameras.main.width / 2,
      scene.cameras.main.height / 2 - 60, "", {
        fontSize: "22px", fontStyle: "bold", fontFamily: "monospace",
        color: "#ffdd44", stroke: "#000", strokeThickness: 5,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(30).setVisible(false);
  }

  update(money: number, inventory: FishCatch[], season = 1, seasonName = "Spring", ecosystemState?: EcosystemState) {
    this.moneyText.setText(`💰 $${money.toLocaleString()}`);
    this.seasonText.setText(`🌿 Season ${season} — ${seasonName}`);

    if (inventory.length === 0) {
      this.inventoryText.setText("🐟 Inventory: empty");
    } else {
      const counts: Record<string, number> = {};
      inventory.forEach(f => { counts[f.rarity] = (counts[f.rarity] ?? 0) + 1; });
      const summary = Object.entries(counts).map(([r, n]) => `${n} ${r}`).join("  ");
      this.inventoryText.setText(`🐠 ${inventory.length} fish  (${summary})`);
    }

    if (ecosystemState) {
      const { coralHealth, acidityLevel, pollutionLevel, fishPopulations } = ecosystemState;
      const coralStr = coralHealth   != null ? `🪸 ${coralHealth.toFixed(0)}%` : "";
      const acidStr  = acidityLevel  != null ? `💧 pH ${acidityLevel.toFixed(2)}` : "";
      const pollStr  = pollutionLevel != null ? `☣ ${pollutionLevel.toFixed(0)}%` : "";
      this.ecosystemText.setText([coralStr, pollStr, acidStr].filter(Boolean).join("  "));
    }
  }

  showSeasonBanner(season: number, seasonName: string) {
    const cam = this.scene.cameras.main;
    const banner = this.scene.add.text(cam.width / 2, cam.height / 2, `🌿 Season ${season} — ${seasonName}`, {
      fontSize: "28px", fontStyle: "bold", fontFamily: "monospace",
      color: "#aaffcc", stroke: "#000", strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(40).setAlpha(0);

    this.scene.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      y: cam.height / 2 - 20,
      duration: 400, ease: "Cubic.easeOut",
      yoyo: true, hold: 1200,
      onComplete: () => banner.destroy(),
    });
  }

  showSellFeedback(earned: number, count: number) {
    if (earned <= 0) return;
    this.sellFeedback
      .setText(`🏪 Sold ${count} fish for $${earned}!`)
      .setAlpha(1).setVisible(true);

    this.scene.tweens.add({
      targets: this.sellFeedback,
      alpha: 0,
      y: this.sellFeedback.y - 40,
      duration: 2000, ease: "Cubic.easeOut",
      onComplete: () => {
        this.sellFeedback.setVisible(false)
          .setY(this.scene.cameras.main.height / 2 - 60);
      },
    });
  }

  displayWarning(message: string) {
    const cam = this.scene.cameras.main;
    const warning = this.scene.add.text(cam.width / 2, cam.height / 2 - 100, message, {
      fontSize: "20px", fontStyle: "bold", fontFamily: "monospace",
      color: "#ff4444", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50).setAlpha(0);

    this.scene.tweens.add({
      targets: warning,
      alpha: { from: 0, to: 1 },
      y: warning.y - 20,
      duration: 400, ease: "Cubic.easeOut",
      yoyo: true, hold: 1200,
      onComplete: () => warning.destroy(),
    });
  }
}