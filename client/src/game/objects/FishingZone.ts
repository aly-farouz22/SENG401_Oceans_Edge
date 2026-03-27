import Phaser from "phaser";

export interface FishCatch {
  endangered: boolean;
  isJuvenile: boolean;
  invasive:   boolean;
  amount: number;
  name: string;
  ecosystemName?: string;
  rarity: "common" | "uncommon" | "rare" | "legendary" | "trash";
  points: number;
}

const FISH_TABLE: FishCatch[] = [
  { name: "Anchovy Sprat",   ecosystemName: "Anchovy",   rarity: "common",    points: 15,  endangered: false, invasive: false, isJuvenile: false, amount: 1 },
  { name: "Haddock",         ecosystemName: "Haddock",   rarity: "common",    points: 15,  endangered: false, invasive: false, isJuvenile: false, amount: 1 },
  { name: "Opah",            ecosystemName: "Opah",     rarity: "uncommon",  points: 25,  endangered: false, invasive: false, isJuvenile: false, amount: 1 },
  { name: "Red Snapper",     ecosystemName: "Snapper",     rarity: "uncommon",  points: 30,  endangered: false, invasive: false, isJuvenile: false, amount: 1 },
  { name: "Pacific Halibut", ecosystemName: "Halibut",   rarity: "rare",      points: 40,  endangered: false, invasive: false, isJuvenile: false, amount: 1 },
  { name: "Swordfish",       ecosystemName: "Swordfish",     rarity: "rare",      points: 40, endangered: false, invasive: false, isJuvenile: false, amount: 1 },
  { name: "Aurora Trout",    ecosystemName: "Trout",  rarity: "common", points: 30, endangered: true,  invasive: false, isJuvenile: false, amount: 1 },
  { name: "Bluefin Tuna",    ecosystemName: "Tuna",  rarity: "legendary", points: 50, endangered: true,  invasive: false, isJuvenile: false, amount: 1 },
  { name: "Lionfish",        ecosystemName: "Lionfish", rarity: "uncommon",  points: 20,  endangered: false, invasive: true,  isJuvenile: false, amount: 1 },
  { name: "Green Crab",      ecosystemName: "Crab", rarity: "common",    points: 8,   endangered: false, invasive: true,  isJuvenile: false, amount: 1 },
];

const TRASH_TABLE: FishCatch[] = [
  { name: "Water Bottle",   rarity: "trash", points: 0, endangered: false, invasive: false, isJuvenile: false, amount: 1 },
  { name: "Cigarette Buds", rarity: "trash", points: 0, endangered: false, invasive: false, isJuvenile: false, amount: 1 },
];

const RARITY_WEIGHTS = { common: 40, uncommon: 30, rare: 20, legendary: 10 };

const BAR_WIDTH      = 64;
const BAR_HEIGHT     = 8;
const MAX_STOCK      = 6;
const DEPLETE_AMOUNT = 1;
const BASE_REGEN     = 0.04;  // base regen per second — scaled by ProgressionSystem
const FADE_DURATION  = 800;

export default class FishingZone extends Phaser.GameObjects.Zone {
  private label:    Phaser.GameObjects.Text;
  private sprite:   Phaser.GameObjects.Image;
  private barBg:    Phaser.GameObjects.Rectangle;
  private barFill:  Phaser.GameObjects.Rectangle;
  private emptyText: Phaser.GameObjects.Text;

  stock                = MAX_STOCK;   // package-accessible for TrashZone seep
  private regenRate    = 1.0;  // multiplier from ProgressionSystem (1.0 = normal)
  private barY:        number;
  private _destroyed   = false;
  private pollutionLevel = 0;

  get isEmpty()  { return this.stock <= 0; }
  get currentStock() { return this.stock; }
  get isGone()   { return this._destroyed; }

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number, height: number,
    name = "Fishing Spot"
  ) {
    super(scene, x, y, width, height);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    const radius = Math.min(width, height) / 2;
    this.barY    = y - radius - 22;

    // ── FishingZone sprite (replaces glowCircle) ──────────────────────────────
    // Compute scale to reach 1.5x zone size from actual texture dimensions
    const texW       = scene.textures.get("fishing_zone").getSourceImage().width  || 1;
    const texH       = scene.textures.get("fishing_zone").getSourceImage().height || 1;
    const baseScaleX = (width  * 1.5) / texW;
    const baseScaleY = (height * 1.5) / texH;

    this.sprite = scene.add.image(x, y, "fishing_zone")
      .setScale(baseScaleX, baseScaleY)
      .setDepth(4)
      .setAlpha(0.85);

    // Gentle pulse like the old glow circle
    scene.tweens.add({
      targets: this.sprite,
      alpha:  { from: 0.55, to: 0.95 },
      scaleX: { from: baseScaleX * 0.95, to: baseScaleX * 1.05 },
      scaleY: { from: baseScaleY * 0.95, to: baseScaleY * 1.05 },
      duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    this.label = scene.add.text(x, this.barY - 14, `🎣 ${name}`, {
      fontSize: "13px", color: "#a0e8ff",
      stroke: "#003344", strokeThickness: 3, fontFamily: "monospace",
    }).setOrigin(0.5, 1).setDepth(8);

    this.barBg = scene.add.rectangle(x, this.barY, BAR_WIDTH, BAR_HEIGHT, 0x112233)
      .setDepth(9);

    this.barFill = scene.add.rectangle(
      x - BAR_WIDTH / 2, this.barY, BAR_WIDTH, BAR_HEIGHT, 0x00dd88
    ).setOrigin(0, 0.5).setDepth(10);

    this.emptyText = scene.add.text(x, this.barY - 10, "⚠ Depleted", {
      fontSize: "11px", color: "#ff6644",
      stroke: "#220000", strokeThickness: 2, fontFamily: "monospace",
    }).setOrigin(0.5, 1).setDepth(10).setVisible(false);
  }

  /** Called by ProgressionSystem each season. rate=1.0 is normal, 0.5 = half speed. */
  setRegenRate(rate: number) {
    this.regenRate = Math.max(0.1, rate);
  }

  setPollution(level: number) {
    this.pollutionLevel = Math.max(0, Math.min(100, level));
    const t     = this.pollutionLevel / 100;
    // Tint sprite from clean blue → murky brown as pollution rises
    const r = Math.round(Phaser.Math.Linear(0x00, 0x88, t));
    const g = Math.round(Phaser.Math.Linear(0xaa, 0x66, t));
    const b = Math.round(Phaser.Math.Linear(0xff, 0x33, t));
    this.sprite.setTint(Phaser.Display.Color.GetColor(r, g, b));
  }

  updateRegen(delta: number) {
    if (this._destroyed || this.stock >= MAX_STOCK) return;
    this.stock = Math.min(MAX_STOCK, this.stock + BASE_REGEN * this.regenRate * (delta / 1000));
    this.refreshBar();
  }

  regenStock(amount: number) {
    if (this._destroyed) return;
    this.stock = Math.min(MAX_STOCK, this.stock + amount);
    this.refreshBar();
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.95, to: 0.55 },
      duration: 600,
      ease: "Cubic.easeOut",
    });
  }

  castLine(): FishCatch | null {
    if (this.isEmpty || this._destroyed) return null;

    let result: FishCatch | null = null;

    const trashChance = (this.pollutionLevel / 100) * 40;
    if (Phaser.Math.Between(1, 100) <= trashChance) {
      result = TRASH_TABLE[Phaser.Math.Between(0, TRASH_TABLE.length - 1)];
    } else {
      const roll = Phaser.Math.Between(1, 100);
      let cumulative = 0;
      let rarity: keyof typeof RARITY_WEIGHTS = "common";

      for (const [r, weight] of Object.entries(RARITY_WEIGHTS) as [keyof typeof RARITY_WEIGHTS, number][]) {
        cumulative += weight;
        if (roll <= cumulative) { rarity = r; break; }
      }

      const pool = FISH_TABLE.filter(f => f.rarity === rarity);
      result = pool.length ? pool[Phaser.Math.Between(0, pool.length - 1)] : null;
    }

    if (!result?.invasive) {
      this.stock = Math.max(0, this.stock - DEPLETE_AMOUNT);
      this.refreshBar();

      if (this.stock <= 0) {
        this.fadeAndDestroy();
        return null;
      }
    }

    return result;
  }

  private fadeAndDestroy() {
    this._destroyed = true;
    const body = this.body as Phaser.Physics.Arcade.StaticBody | null;
    if (body) body.enable = false;

    const targets = [this.sprite, this.label, this.barBg, this.barFill, this.emptyText];
    this.scene.tweens.add({
      targets,
      alpha: 0,
      duration: FADE_DURATION,
      ease: "Cubic.easeIn",
      onComplete: () => {
        targets.forEach(t => t?.destroy());
        super.destroy();
      },
    });
  }

  refreshBar() {
    const pct = this.stock / MAX_STOCK;
    this.barFill.setDisplaySize(BAR_WIDTH * pct, BAR_HEIGHT);

    const color = pct > 0.5
      ? Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(0xffdd00),
          Phaser.Display.Color.ValueToColor(0x00dd88),
          100, Math.round((pct - 0.5) * 200)
        )
      : Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(0xff4400),
          Phaser.Display.Color.ValueToColor(0xffdd00),
          100, Math.round(pct * 200)
        );

    this.barFill.setFillStyle(
      Phaser.Display.Color.GetColor(color.r, color.g, color.b)
    );

    // Fade sprite with stock level
    this.sprite.setAlpha(0.3 + 0.65 * pct);
    this.emptyText.setVisible(this.isEmpty);
  }

  destroy(fromScene?: boolean) {
    if (this._destroyed) return;
    this._destroyed = true;
    this.sprite?.destroy();
    this.label?.destroy();
    this.barBg?.destroy();
    this.barFill?.destroy();
    this.emptyText?.destroy();
    super.destroy(fromScene);
  }
}