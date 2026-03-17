import Phaser from "phaser";
import { EcosystemSystem } from "../systems/EcosystemSystem";

const BAR_WIDTH           = 64;
const BAR_HEIGHT          = 8;
const POLLUTION_REDUCTION = 15;
const FISH_BOOST          = 10;
const TRASH_STOCK         = 2; // number of casts to clear the zone

export default class TrashZone extends Phaser.GameObjects.Zone {
  private label:       Phaser.GameObjects.Text;
  private glowCircle:  Phaser.GameObjects.Arc;
  private barBg:       Phaser.GameObjects.Rectangle;
  private barFill:     Phaser.GameObjects.Rectangle;

  private trashStock   = TRASH_STOCK;
  private _destroyed   = false;
  private ecosystem:   EcosystemSystem;

  get isGone()     { return this._destroyed; }
  get isCleaning() { return false; } // kept for compatibility

  public onCleaned?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number, height: number,
    ecosystem: EcosystemSystem,
    name = "Trash Patch"
  ) {
    super(scene, x, y, width, height);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.ecosystem = ecosystem;

    const radius = Math.min(width, height) / 2;
    const barY = y - radius - 22;

    this.glowCircle = scene.add.circle(x, y, radius, 0x886633, 0.35);
    scene.tweens.add({
      targets: this.glowCircle,
      alpha:  { from: 0.2, to: 0.5 },
      scaleX: { from: 0.95, to: 1.05 },
      scaleY: { from: 0.95, to: 1.05 },
      duration: 1600, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    this.label = scene.add.text(x, barY - 14, `🗑 ${name}`, {
      fontSize: "13px", color: "#ffcc66",
      stroke: "#332200", strokeThickness: 3, fontFamily: "monospace",
    }).setOrigin(0.5, 1).setDepth(8);

    this.barBg = scene.add.rectangle(x, barY, BAR_WIDTH, BAR_HEIGHT, 0x332200)
      .setDepth(9);

    this.barFill = scene.add.rectangle(
      x - BAR_WIDTH / 2, barY, BAR_WIDTH, BAR_HEIGHT, 0x886633
    ).setOrigin(0, 0.5).setDepth(10);
  }

  collectTrash() {
    if (this._destroyed) return;

    this.trashStock--;

    // Update bar to show remaining trash
    const pct = Math.max(0, this.trashStock / TRASH_STOCK);
    this.barFill.setDisplaySize(BAR_WIDTH * pct, BAR_HEIGHT);

    // Flash the glow to give feedback
    this.scene.tweens.add({
      targets: this.glowCircle,
      alpha: { from: 0.8, to: 0.35 },
      duration: 300, ease: "Cubic.easeOut",
    });

    if (this.trashStock <= 0) {
      this.ecosystem.cleanPollution(POLLUTION_REDUCTION);
      const state = this.ecosystem.getState();
      state.fishPopulations.forEach(fish => {
        fish.population = Math.min(fish.population * 1.05, fish.population + FISH_BOOST);
      });
      this.onCleaned?.();
      this.fadeAndDestroy();
    }
  }

  // Kept for compatibility with MainScene calling z.update(delta)
  update(_delta: number) {}

  private fadeAndDestroy() {
    this._destroyed = true;

    const body = this.body as Phaser.Physics.Arcade.StaticBody | null;
    if (body) body.enable = false;

    const targets = [this.glowCircle, this.label, this.barBg, this.barFill];

    this.scene.tweens.add({
      targets,
      alpha: 0,
      duration: 800,
      ease: "Cubic.easeIn",
      onComplete: () => {
        targets.forEach(t => t?.destroy());
        super.destroy();
      },
    });
  }

  destroy(fromScene?: boolean) {
    if (this._destroyed) return;
    this._destroyed = true;
    this.label?.destroy();
    this.glowCircle?.destroy();
    this.barBg?.destroy();
    this.barFill?.destroy();
    super.destroy(fromScene);
  }
}