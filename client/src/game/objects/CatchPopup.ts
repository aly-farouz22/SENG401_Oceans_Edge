import Phaser from "phaser";
import { FishCatch } from "./FishingZone";

const RARITY_COLORS: Record<string, string> = {
  common:     "#ffffff",
  uncommon:   "#44ff88",
  rare:       "#4488ff",
  endangered: "#ff8844",
  legendary:  "#ffcc00",
  invasive:   "#cc44ff",
  trash:      "#886633",
};

const RARITY_LABELS: Record<string, string> = {
  common:     "Common",
  uncommon:   "Uncommon",
  rare:       "Rare",
  endangered: "⚠ Endangered",
  legendary:  "✨ Legendary",
  invasive:   "🦁 Invasive Species",
  trash:      "🗑 Pollution Trash",
};

const FISH_IMAGE_MAP: Record<string, string> = {
  "Anchovy Sprat":  "fish_anchovy",
  "Haddock":        "fish_haddock",
  "Opah":           "fish_opah",
  "Pacific Halibut":"fish_halibut",
  "Red Snapper":    "fish_snapper",
  "Aurora Trout":   "fish_aurora",
  "Bluefin Tuna":   "fish_bluefin",
  "Lionfish":       "fish_lionfish",
  "Green Crab":     "fish_crab",
  "Swordfish":      "fish_swordfish",
  "Water Bottle":   "trash_bottle",
  "Cigarette Buds": "trash_cigarette",
};

const FISH_SCALE = 4;

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

    const isTrash      = fish.rarity === "trash";
    const isEndangered = fish.endangered;
    const isInvasive   = fish.invasive;

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

    const header = this.scene.add.text(
      cx, cy - PH / 2 + 22,
      isTrash ? "🗑  You caught trash!" : "🎣  You caught!",
      {
        fontSize: "20px",
        color: isTrash ? "#ff9944" : "#a0e8ff",
        fontFamily: "monospace",
        stroke: "#000", strokeThickness: 3, fontStyle: "bold",
      }
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(202);

    const imageKey = FISH_IMAGE_MAP[fish.name];
    let img: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
    if (imageKey && this.scene.textures.exists(imageKey)) {
      img = this.scene.add.image(cx, cy - 60, imageKey)
        .setScrollFactor(0).setDepth(202)
        .setScale(FISH_SCALE);
      (img as Phaser.GameObjects.Image).texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    } else {
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

    // ── Species warning tag ───────────────────────────────────────────────────
    let warningText: Phaser.GameObjects.Text | null = null;
    if (isEndangered) {
      warningText = this.scene.add.text(cx, cy + 264,
        "⚠  ENDANGERED  —  counted toward your catch limit!", {
        fontSize: "13px", fontStyle: "bold", color: "#ff4444",
        fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
        backgroundColor: "#2a0000", padding: { x: 12, y: 6 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    } else if (isInvasive) {
      warningText = this.scene.add.text(cx, cy + 264,
        "☠  INVASIVE SPECIES  —  removing them helps the ocean!", {
        fontSize: "13px", fontStyle: "bold", color: "#cc44ff",
        fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
        backgroundColor: "#1a0028", padding: { x: 12, y: 6 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    }

    const pointsText = this.scene.add.text(
      cx, cy + PH / 2 - 52,
      isTrash ? "No reward 🚯" : `+ $${fish.points}`,
      {
        fontSize: "22px", fontStyle: "bold",
        color: isTrash ? "#886633" : "#ffdd44",
        fontFamily: "monospace", stroke: "#000", strokeThickness: 4,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    const hint = this.scene.add.text(cx, cy + PH / 2 - 22, "click anywhere to continue", {
      fontSize: "12px", color: "#445566", fontFamily: "monospace",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    const all: Phaser.GameObjects.GameObject[] = [
      overlay, panel, border, accentLine, header, img,
      nameText, rarityText, pointsText, hint,
    ];
    if (warningText) all.push(warningText);

    this.container = this.scene.add.container(0, 0, all).setDepth(200);

    all.forEach(o => (o as any).setAlpha(0));
    this.scene.tweens.add({
      targets: all, alpha: 1, duration: 220, ease: "Cubic.easeOut",
    });
    this.scene.tweens.add({
      targets: [panel, border],
      scaleX: { from: 0.75, to: 1 },
      scaleY: { from: 0.75, to: 1 },
      duration: 280, ease: "Back.easeOut",
    });
    this.scene.tweens.add({
      targets: [img],
      scaleX: { from: FISH_SCALE * 0.75, to: FISH_SCALE },
      scaleY: { from: FISH_SCALE * 0.75, to: FISH_SCALE },
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