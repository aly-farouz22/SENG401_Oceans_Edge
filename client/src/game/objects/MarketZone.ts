import Phaser from "phaser";
import { FishCatch } from "./FishingZone";

export type MarketChoice = "sell" | "end_season" | "cancel";

/**
 * A dock/market zone. When the boat enters, a menu appears offering:
 *   Sell    — sell inventory, stay in season
 *   End Season — sell inventory AND advance the season
 *   Cancel  — do nothing
 *
 * Call showMenu() to display it; it auto-hides on choice.
 * onChoice fires with the player's selection.
 */
export default class MarketZone extends Phaser.GameObjects.Zone {
  private glowRect:   Phaser.GameObjects.Rectangle;
  private glowBorder: Phaser.GameObjects.Rectangle;
  private label:      Phaser.GameObjects.Text;

  // Menu UI
  private menuContainer: Phaser.GameObjects.Container;
  private isMenuOpen = false;

  onChoice?: (choice: MarketChoice, inventory: FishCatch[]) => void;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    width = 120, height = 80,
    name = "Market Dock"
  ) {
    super(scene, x, y, width, height);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    // Dock visuals
    this.glowRect = scene.add.rectangle(x, y, width, height, 0xffaa00, 0.15);
    this.glowBorder = scene.add.rectangle(x, y, width, height)
      .setStrokeStyle(2, 0xffcc44, 0.8).setFillStyle(0, 0);

    scene.tweens.add({
      targets: [this.glowRect, this.glowBorder],
      alpha: { from: 0.15, to: 0.45 },
      duration: 1000, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    this.label = scene.add.text(x, y - height / 2 - 14, `🏪 ${name}`, {
      fontSize: "13px", color: "#ffdd88",
      stroke: "#332200", strokeThickness: 3, fontFamily: "monospace",
    }).setOrigin(0.5, 1).setDepth(10);

    // Build the menu (hidden by default)
    this.menuContainer = this.buildMenu(scene, x, y);
  }

  private buildMenu(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
    const W = 220, H = 160;
    const container = scene.add.container(x, y - 120).setDepth(50).setVisible(false);

    // Panel background
    const bg = scene.add.rectangle(0, 0, W, H, 0x001a2e, 0.95)
      .setStrokeStyle(2, 0xffcc44, 1);

    const title = scene.add.text(0, -H / 2 + 16, "🏪 Market", {
      fontSize: "15px", fontStyle: "bold", color: "#ffdd88",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5);

    const sellBtn    = this.makeButton(scene,  0, -18, "Sell Fish",   "#44ff88", "sell");
    const seasonBtn  = this.makeButton(scene,  0,  28, "End Season",  "#ffaa44", "end_season");
    const cancelBtn  = this.makeButton(scene,  0,  64, "Cancel",      "#ff6666", "cancel");

    container.add([bg, title, sellBtn, seasonBtn, cancelBtn]);
    return container;
  }

  private makeButton(
    scene: Phaser.Scene,
    x: number, y: number,
    label: string,
    color: string,
    choice: MarketChoice
  ): Phaser.GameObjects.Text {
    const btn = scene.add.text(x, y, label, {
      fontSize: "14px", color,
      fontFamily: "monospace",
      stroke: "#000", strokeThickness: 3,
      backgroundColor: "#0a2233",
      padding: { x: 14, y: 6 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on("pointerover",  () => btn.setAlpha(0.75))
    .on("pointerout",   () => btn.setAlpha(1))
    .on("pointerdown",  () => {
      this.hideMenu();
      // Pass current inventory snapshot via callback
      this.onChoice?.(choice, []);
    });
    return btn;
  }

  /** Show the market menu. Pass the current inventory so Cancel can restore it. */
  showMenu(inventory: FishCatch[]) {
    if (this.isMenuOpen) return;
    this.isMenuOpen = true;

    // Patch the buttons to carry the live inventory reference
    const buttons = (this.menuContainer.list as Phaser.GameObjects.Text[])
      .filter(obj => obj instanceof Phaser.GameObjects.Text && obj.text !== "🏪 Market");

    buttons.forEach(btn => {
      btn.removeAllListeners("pointerdown");
      const choice = (
        btn.text === "Sell Fish"   ? "sell" :
        btn.text === "End Season"  ? "end_season" : "cancel"
      ) as MarketChoice;
      btn.on("pointerdown", () => {
        this.hideMenu();
        this.onChoice?.(choice, inventory);
      });
    });

    this.menuContainer.setVisible(true).setAlpha(0);
    this.scene.tweens.add({
      targets: this.menuContainer,
      alpha: 1, y: this.menuContainer.y - 10,
      duration: 200, ease: "Cubic.easeOut",
    });
  }

  hideMenu() {
    if (!this.isMenuOpen) return;
    this.isMenuOpen = false;
    this.scene.tweens.add({
      targets: this.menuContainer,
      alpha: 0,
      duration: 150,
      onComplete: () => this.menuContainer.setVisible(false),
    });
  }

  get menuOpen() { return this.isMenuOpen; }

  /** Sell all fish and return the total earned. */
  sellAll(inventory: FishCatch[]): number {
    return inventory.reduce((sum, f) => sum + f.points, 0);
  }

  destroy(fromScene?: boolean) {
    this.label?.destroy();
    this.glowRect?.destroy();
    this.glowBorder?.destroy();
    this.menuContainer?.destroy();
    super.destroy(fromScene);
  }
}