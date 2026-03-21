import Phaser from "phaser";
import { EcosystemState } from "../systems/EcosystemSystem";
import { FuelSystem } from "../systems/FuelSystem";
import FishCollection from "./FishCollection";
import { FishCatch } from "./FishingZone";

const BAR_H = 64; // height of the UI bar sprite

export default class HUD {
  private scene: Phaser.Scene;
  private uiBar:         Phaser.GameObjects.Image;
  private moneyText:     Phaser.GameObjects.Text;
  private seasonText:    Phaser.GameObjects.Text;
  private inventoryText: Phaser.GameObjects.Text;
  private ecosystemText: Phaser.GameObjects.Text;
  private sellFeedback:  Phaser.GameObjects.Text;
  private menuBtn:       Phaser.GameObjects.Image;

  // Fuel bar
  private fuelBarBg:   Phaser.GameObjects.Rectangle;
  private fuelBarFill: Phaser.GameObjects.Rectangle;
  private fuelSprite:  Phaser.GameObjects.Image;
  private fuelSystem?: FuelSystem;
  private fuelWarning: Phaser.GameObjects.Text;

  private collectionBtn!: Phaser.GameObjects.Text;
  private caughtFishIds:  Set<string> = new Set();
  private openCollection?: FishCollection;

  public onMenuOpen?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const cam  = scene.cameras.main;
    const W    = cam.width;
    const H    = cam.height;
    const barY = H - BAR_H / 2;

    // ── UI bar sprite (bottom) ────────────────────────────────────────────────
    this.uiBar = scene.add.image(W / 2, barY, "ui_bar")
      .setDisplaySize(W, BAR_H)
      .setScrollFactor(0)
      .setDepth(20);

    const row1 = H - BAR_H + 10;
    const row2 = H - BAR_H + 36;

    // ── Money ─────────────────────────────────────────────────────────────────
    this.moneyText = scene.add.text(12, row1, "💰 $0", {
      fontSize: "15px", color: "#ffdd44", fontStyle: "bold",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 3,
    }).setScrollFactor(0).setDepth(21);

    // ── Season ────────────────────────────────────────────────────────────────
    this.seasonText = scene.add.text(12, row2, "🌿 Season 1 — Spring", {
      fontSize: "12px", color: "#aaffcc",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
    }).setScrollFactor(0).setDepth(21);

    // ── Inventory ─────────────────────────────────────────────────────────────
    this.inventoryText = scene.add.text(W / 2, row1, "🐟 Inventory: empty", {
      fontSize: "12px", color: "#a0e8ff",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(21);

    // ── Ecosystem ─────────────────────────────────────────────────────────────
    this.ecosystemText = scene.add.text(W / 2, row2, "🌊 Ecosystem: Healthy", {
      fontSize: "11px", color: "#a0ffaa",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(21);

    // ── Fuel bar sprite (top-left) ────────────────────────────────────────────
    // FuelBar.png is 98×34px. Scale 4× for visibility.
    const SCALE      = 4;
    const SPRITE_W   = 98 * SCALE;
    const SPRITE_H   = 34 * SCALE;
    const spriteX    = SPRITE_W / 2 + 8;
    const spriteY    = SPRITE_H / 2 + 8;

    this.fuelSprite = scene.add.image(spriteX, spriteY, "fuel_bar")
      .setDisplaySize(SPRITE_W, SPRITE_H)
      .setScrollFactor(0).setDepth(21);

    // Overlay the green fill on the bar portion of the sprite.
    // Canister occupies left ~35% (34px of 98px), bar the remaining ~65% (64px).
    const barStartX  = 8 + 34 * SCALE;
    const fuelBarW   = 64 * SCALE;
    const fuelBarH   = 20;
    const barCenterY = spriteY + 2;

    this.fuelBarBg = scene.add.rectangle(
      barStartX + fuelBarW / 2, barCenterY, fuelBarW, fuelBarH, 0x1a0a00
    ).setScrollFactor(0).setDepth(22);

    this.fuelBarFill = scene.add.rectangle(
      barStartX, barCenterY, fuelBarW, fuelBarH, 0x44dd44
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(23);

    // ── Fuel empty warning ────────────────────────────────────────────────────
    this.fuelWarning = scene.add.text(
      W / 2, H / 2 - 100,
      "⛽ Out of fuel! Sail to the dock to refuel.", {
        fontSize: "16px", fontStyle: "bold", fontFamily: "monospace",
        color: "#ffcc44", stroke: "#000", strokeThickness: 4,
        backgroundColor: "#220d00", padding: { x: 14, y: 8 },
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(30).setVisible(false);

    // ── Sell feedback ─────────────────────────────────────────────────────────
    this.sellFeedback = scene.add.text(W / 2, H / 2 - 60, "", {
      fontSize: "22px", fontStyle: "bold", fontFamily: "monospace",
      color: "#ffdd44", stroke: "#000", strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setVisible(false);

    // ── Pause button (top-right) ──────────────────────────────────────────────
    this.menuBtn = scene.add.image(W - 40, 40, "pause_btn")
      .setDisplaySize(56, 56)
      .setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on("pointerover",  function(this: Phaser.GameObjects.Image) { this.setAlpha(0.75); })
      .on("pointerout",   function(this: Phaser.GameObjects.Image) { this.setAlpha(1); })
      .on("pointerdown",  () => this.onMenuOpen?.());

    // ── Collection button ────────────────────────────────────────────────────
    this.collectionBtn = scene.add.text(W - 100, 12, "📖", {
      fontSize: "22px", fontFamily: "monospace",
      stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(21)
      .setInteractive({ useHandCursor: true })
      .on("pointerover",  function(this: Phaser.GameObjects.Text) { this.setAlpha(0.75); })
      .on("pointerout",   function(this: Phaser.GameObjects.Text) { this.setAlpha(1); })
      .on("pointerdown",  () => {
        if (this.openCollection) return;
        this.openCollection = new FishCollection(this.scene);
        this.openCollection.onClose = () => { this.openCollection = undefined; };
        this.openCollection.show([...this.caughtFishIds]);
      });

    scene.input.keyboard!.on("keydown-ESC", () => this.onMenuOpen?.());
  }

  /** Call whenever a non-trash fish is caught to track collection progress. */
  registerCatch(fishId: string): void {
    this.caughtFishIds.add(fishId);
  }

  registerFuel(fuelSystem: FuelSystem) {
    this.fuelSystem = fuelSystem;
  }

  update(
    money: number,
    inventory: FishCatch[],
    season = 1,
    seasonName = "Spring",
    ecosystemState?: EcosystemState
  ) {
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
      const { coralHealth, acidityLevel, pollutionLevel, biodiversityIndex } = ecosystemState;
      this.ecosystemText.setText(
        `🪸 ${coralHealth.toFixed(0)}%  ☣ ${pollutionLevel.toFixed(0)}%  💧 pH ${acidityLevel.toFixed(2)}  🌱 ${biodiversityIndex.toFixed(0)}%`
      );
    }

    // ── Fuel bar update ───────────────────────────────────────────────────────
    if (this.fuelSystem) {
      const ratio = this.fuelSystem.ratio;
      const barW  = 64 * 4;
      const color = ratio > 0.5 ? 0x44dd44 : ratio > 0.25 ? 0xff8844 : 0xff4444;

      this.fuelBarFill.setDisplaySize(Math.max(barW * ratio, 0), 20);
      this.fuelBarFill.setFillStyle(color);

      const isEmpty = this.fuelSystem.isEmpty;
      if (isEmpty && !this.fuelWarning.visible) {
        this.fuelWarning.setVisible(true).setAlpha(1);
      } else if (!isEmpty && this.fuelWarning.visible) {
        this.fuelWarning.setVisible(false);
      }
    }
  }

  showSeasonBanner(season: number, seasonName: string) {
    const cam    = this.scene.cameras.main;
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
    const cam     = this.scene.cameras.main;
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