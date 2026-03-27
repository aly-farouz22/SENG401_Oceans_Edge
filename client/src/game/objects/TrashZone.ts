import Phaser from "phaser";
import { EcosystemSystem } from "../systems/EcosystemSystem";
import FishingZone from "./FishingZone";

const BAR_WIDTH           = 64;
const BAR_HEIGHT          = 8;
const POLLUTION_REDUCTION = 15;
const FISH_BOOST          = 10;
const TRASH_STOCK         = 2;

// How long (ms) before trash starts seeping into nearest fishing zone
const SEEP_DELAY_MS   = 30_000; // 30 seconds uncleaned
// How often seep damage ticks once started
const SEEP_TICK_MS    = 5_000;
// Stock drained from nearest fishing zone per seep tick
const SEEP_DAMAGE     = 0.4;

export default class TrashZone extends Phaser.GameObjects.Zone {
  private label:       Phaser.GameObjects.Text;
  private glowCircle:  Phaser.GameObjects.Arc;
  private barBg:       Phaser.GameObjects.Rectangle;
  private barFill:     Phaser.GameObjects.Rectangle;
  private seepWarning: Phaser.GameObjects.Text;

  private trashStock   = TRASH_STOCK;
  private _destroyed   = false;
  private ecosystem:   EcosystemSystem;

  // Seep tracking
  private ageMs        = 0;
  private seepAccumMs  = 0;
  private isSeeeping   = false;
  private nearestZone: FishingZone | null = null;

  /** Set from MainScene after fishing zones are registered */
  fishingZones: FishingZone[] = [];

  get isGone()     { return this._destroyed; }
  get isCleaning() { return false; }

  get saveState() {
    return {
      x:           this.x,
      y:           this.y,
      trashStock:  this.trashStock,
      ageMs:       this.ageMs,
      isSeeeping:  this.isSeeeping,
      seepAccumMs: this.seepAccumMs,
    };
  }
  set currentTrashStock(value: number)  { this.trashStock  = value; }
  set currentAgeMs(value: number)       { this.ageMs       = value; }
  set currentSeepAccumMs(value: number) { this.seepAccumMs = value; }
  set currentIsSeeeping(value: boolean) { this.isSeeeping  = value; }
  refreshBar() {
    const pct = Math.max(0, this.trashStock / TRASH_STOCK);
    this.barFill.setDisplaySize(BAR_WIDTH * pct, BAR_HEIGHT);
  }

  restoreSeepState() {
    if (!this.isSeeeping) return;
    this.glowCircle.setFillStyle(0xff2200);
    this.seepWarning.setVisible(true);
    this.scene.tweens.add({
      targets: this.seepWarning,
      alpha: { from: 0.4, to: 1 },
      duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
  }

  public onCleaned?: () => void;
  /** Called when seep starts — MainScene can show a warning event */
  public onSeepStart?: () => void;

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
    const barY   = y - radius - 22;

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

    // Warning text shown when seep starts
    this.seepWarning = scene.add.text(x, barY - 28, "☠ Seeping!", {
      fontSize: "11px", color: "#ff4444",
      stroke: "#220000", strokeThickness: 2, fontFamily: "monospace",
    }).setOrigin(0.5, 1).setDepth(11).setVisible(false);
  }

  collectTrash() {
    if (this._destroyed) return;

    this.trashStock--;

    const pct = Math.max(0, this.trashStock / TRASH_STOCK);
    this.barFill.setDisplaySize(BAR_WIDTH * pct, BAR_HEIGHT);

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

  update(delta: number) {
    if (this._destroyed) return;

    this.ageMs += delta;

    // ── Start seeping after delay ───────────────────────────────────────────
    if (!this.isSeeeping && this.ageMs >= SEEP_DELAY_MS) {
      this.isSeeeping  = true;
      this.nearestZone = this.findNearestFishingZone();

      // Visual feedback — glow turns red, warning appears
      this.glowCircle.setFillStyle(0xff2200);
      this.seepWarning.setVisible(true);
      this.scene.tweens.add({
        targets: this.seepWarning,
        alpha: { from: 0.4, to: 1 },
        duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      });

      this.onSeepStart?.();
    }

    // ── Seep tick — drain nearest fishing zone ──────────────────────────────
    if (this.isSeeeping && this.nearestZone && !this.nearestZone.isGone) {
      this.seepAccumMs += delta;
      if (this.seepAccumMs >= SEEP_TICK_MS) {
        this.seepAccumMs -= SEEP_TICK_MS;
        // Drain stock directly on the fishing zone
        (this.nearestZone as any).stock = Math.max(
          0,
          ((this.nearestZone as any).stock ?? 0) - SEEP_DAMAGE
        );
        (this.nearestZone as any).refreshBar?.();
      }
    } else if (this.isSeeeping) {
      // Original zone gone — find next nearest
      this.nearestZone = this.findNearestFishingZone();
    }
  }

  private findNearestFishingZone(): FishingZone | null {
    let nearest: FishingZone | null = null;
    let minDist = Infinity;
    for (const zone of this.fishingZones) {
      if (zone.isGone) continue;
      const dx   = zone.x - this.x;
      const dy   = zone.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; nearest = zone; }
    }
    return nearest;
  }

  private fadeAndDestroy() {
    this._destroyed = true;

    const body = this.body as Phaser.Physics.Arcade.StaticBody | null;
    if (body) body.enable = false;

    const targets = [this.glowCircle, this.label, this.barBg, this.barFill, this.seepWarning];
    this.scene.tweens.add({
      targets, alpha: 0, duration: 800, ease: "Cubic.easeIn",
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
    this.seepWarning?.destroy();
    super.destroy(fromScene);
  }
}