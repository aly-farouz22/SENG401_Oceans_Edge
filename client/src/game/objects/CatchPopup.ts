import Phaser from "phaser";
import { FishCatch } from "./FishingZone";

const RARITY_COLORS: Record<string, string> = {
  common:     "#ffffff",
  uncommon:   "#44ff88",
  rare:       "#4488ff",
  endangered: "#ff8844",
  legendary:  "#ffcc00",
  invasive:   "#cc44ff",
};

const RARITY_LABELS: Record<string, string> = {
  common:     "Common",
  uncommon:   "Uncommon",
  rare:       "Rare",
  endangered: "⚠ Endangered",
  legendary:  "✨ Legendary",
  invasive:   "🦁 Invasive Species",
};

// Map fish names to preloaded texture keys
const FISH_IMAGE_MAP: Record<string, string> = {
  "Sardine":        "fish_anchovy",
  "Mackerel":       "fish_haddock",
  "Herring":        "fish_opah",
  "Bass":           "fish_snapper",
  "Snapper":        "fish_snapper",
  "Tuna":           "fish_bluefin",
  "Swordfish":      "fish_swordfish",
  "Golden Marlin":  "fish_swordfish",
  // extras from our fish table
  "Anchovy":        "fish_anchovy",
  "Haddock":        "fish_haddock",
  "Opah":           "fish_opah",
  "Pacific Halibut":"fish_halibut",
  "Red Snapper":    "fish_snapper",
  "Aurora Trout":   "fish_aurora",
  "Bluefin Tuna":   "fish_bluefin",
  "Lionfish":       "fish_lionfish",
  "Green Crab":     "fish_crab",
};

export default class CatchPopup {
  private scene:     Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private isShowing  = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(fish: FishCatch) {
    if (this.isShowing) this.dismiss();
    this.isShowing = true;

    const W  = this.scene.cameras.main.width;
    const H  = this.scene.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;
    const PW = 560;
    const PH = 700;

    const rarityColor = Phaser.Display.Color.HexStringToColor(
      RARITY_COLORS[fish.rarity] ?? "#ffffff"
    ).color;

    const overlay = this.scene.add.rectangle(cx, cy, W, H, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(200).setInteractive();

    const panel = this.scene.add.rectangle(cx, cy, PW, PH, 0x001a2e, 1)
      .setScrollFactor(0).setDepth(201);

    const border = this.scene.add.rectangle(cx, cy, PW, PH)
      .setStrokeStyle(4, rarityColor, 1).setFillStyle(0, 0)
      .setScrollFactor(0).setDepth(202);

    const accentLine = this.scene.add.rectangle(cx, cy - PH / 2 + 54, PW - 40, 2, rarityColor, 0.6)
      .setScrollFactor(0).setDepth(202);

    const header = this.scene.add.text(cx, cy - PH / 2 + 22, "🎣  You caught!", {
      fontSize: "20px", color: "#a0e8ff", fontFamily: "monospace",
      stroke: "#000", strokeThickness: 3, fontStyle: "bold",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(202);

    // Look up image key by fish name, fall back to a placeholder rectangle
    const imageKey = FISH_IMAGE_MAP[fish.name];
    let img: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
    if (imageKey && this.scene.textures.exists(imageKey)) {
      img = this.scene.add.image(cx, cy - 60, imageKey)
        .setScrollFactor(0).setDepth(202)
        .setDisplaySize(480, 480);
      (img as Phaser.GameObjects.Image).texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    } else {
      // fallback: coloured circle if image not loaded
      img = this.scene.add.rectangle(cx, cy - 60, 120, 120, rarityColor, 0.3)
        .setScrollFactor(0).setDepth(202);
    }

    const nameText = this.scene.add.text(cx, cy + 190, fish.name, {
      fontSize: "28px", fontStyle: "bold",
      color: RARITY_COLORS[fish.rarity] ?? "#ffffff",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    const rarityText = this.scene.add.text(cx, cy + 228, RARITY_LABELS[fish.rarity] ?? fish.rarity, {
      fontSize: "16px", color: RARITY_COLORS[fish.rarity] ?? "#ffffff",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    const pointsText = this.scene.add.text(cx, cy + PH / 2 - 52, `+ $${fish.points}`, {
      fontSize: "22px", fontStyle: "bold", color: "#ffdd44",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    const hint = this.scene.add.text(cx, cy + PH / 2 - 22, "click anywhere to continue", {
      fontSize: "12px", color: "#445566", fontFamily: "monospace",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    const all = [overlay, panel, border, accentLine, header, img,
                 nameText, rarityText, pointsText, hint];

    this.container = this.scene.add.container(0, 0, all).setDepth(200);

    all.forEach(o => o.setAlpha(0));
    this.scene.tweens.add({
      targets: all, alpha: 1, duration: 220, ease: "Cubic.easeOut",
    });
    this.scene.tweens.add({
      targets: [panel, border, img],
      scaleX: { from: 0.75, to: 1 },
      scaleY: { from: 0.75, to: 1 },
      duration: 280, ease: "Back.easeOut",
    });

    const timer = this.scene.time.delayedCall(4000, () => this.dismiss());
    overlay.on("pointerdown", () => { timer.remove(); this.dismiss(); });
  }

  private dismiss() {
    if (!this.container) return;
    this.isShowing = false;
    this.scene.tweens.add({
      targets: this.container.list,
      alpha: 0, duration: 200,
      onComplete: () => { this.container?.destroy(); this.container = null; },
    });
  }
}