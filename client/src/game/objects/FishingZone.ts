import Phaser from "phaser";

export interface FishCatch {
  endangered: boolean;
  isJuvenile: boolean;
  amount: number;
  name: string;
  ecosystemName?: string;
  rarity: "common" | "uncommon" | "rare" | "legendary" | "trash";
  points: number;
}

const FISH_TABLE: FishCatch[] = [
  { name: "Anchovy Sprat",   ecosystemName: "Salmon",   rarity: "common",    points: 5,   endangered: false, isJuvenile: false, amount: 1 },
  { name: "Haddock",         ecosystemName: "Salmon",   rarity: "common",    points: 10,  endangered: false, isJuvenile: false, amount: 1 },
  { name: "Opah",            ecosystemName: "Tuna",     rarity: "uncommon",  points: 25,  endangered: false, isJuvenile: false, amount: 1 },
  { name: "Red Snapper",     ecosystemName: "Tuna",     rarity: "uncommon",  points: 30,  endangered: false, isJuvenile: false, amount: 1 },
  { name: "Pacific Halibut", ecosystemName: "Salmon",   rarity: "rare",      points: 75,  endangered: false, isJuvenile: false, amount: 1 },
  { name: "Swordfish",       ecosystemName: "Tuna",     rarity: "rare",      points: 100, endangered: false, isJuvenile: false, amount: 1 },
  { name: "Aurora Trout",    ecosystemName: "Bluefin",  rarity: "legendary", points: 300, endangered: true,  isJuvenile: false, amount: 1 },
  { name: "Bluefin Tuna",    ecosystemName: "Bluefin",  rarity: "legendary", points: 500, endangered: true,  isJuvenile: false, amount: 1 },
  { name: "Lionfish",        ecosystemName: "Lionfish", rarity: "uncommon",  points: 20,  endangered: false, isJuvenile: false, amount: 1 },
  { name: "Green Crab",      ecosystemName: "Lionfish", rarity: "common",    points: 8,   endangered: false, isJuvenile: false, amount: 1 },
];

const TRASH_TABLE: FishCatch[] = [
  { name: "Water Bottle",   rarity: "trash", points: 0, endangered: false, isJuvenile: false, amount: 1 },
  { name: "Cigarette Buds", rarity: "trash", points: 0, endangered: false, isJuvenile: false, amount: 1 },
];

const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 12, legendary: 3 };

const BAR_WIDTH      = 64;
const BAR_HEIGHT     = 8;
const MAX_STOCK      = 4;
const DEPLETE_AMOUNT = 1;
const REGEN_RATE     = 0.04;
const FADE_DURATION  = 800;

export default class FishingZone extends Phaser.GameObjects.Zone {
  private label:      Phaser.GameObjects.Text;
  private glowCircle: Phaser.GameObjects.Arc;
  private barBg:      Phaser.GameObjects.Rectangle;
  private barFill:    Phaser.GameObjects.Rectangle;
  private emptyText:  Phaser.GameObjects.Text;

  private stock = MAX_STOCK;
  private barY:  number;
  private _destroyed = false;
  private pollutionLevel = 0;

  get isEmpty()  { return this.stock <= 0; }
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
    this.barY = y - radius - 22;

    this.glowCircle = scene.add.circle(x, y, radius, 0x00aaff, 0.18);
    scene.tweens.add({
      targets: this.glowCircle,
      alpha:  { from: 0.1,  to: 0.35 },
      scaleX: { from: 0.95, to: 1.05 },
      scaleY: { from: 0.95, to: 1.05 },
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

  setPollution(level: number) {
    this.pollutionLevel = Math.max(0, Math.min(100, level));
    const t = this.pollutionLevel / 100;
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x00aaff),
      Phaser.Display.Color.ValueToColor(0x886633),
      100, Math.round(t * 100)
    );
    this.glowCircle.setFillStyle(
      Phaser.Display.Color.GetColor(color.r, color.g, color.b)
    );
  }

  updateRegen(delta: number) {
    if (this._destroyed || this.stock >= MAX_STOCK) return;
    this.stock = Math.min(MAX_STOCK, this.stock + REGEN_RATE * (delta / 1000));
    this.refreshBar();
  }

  regenStock(amount: number) {
    if (this._destroyed) return;
    this.stock = Math.min(MAX_STOCK, this.stock + amount);
    this.refreshBar();
    this.scene.tweens.add({
      targets: this.glowCircle,
      alpha: { from: 0.8, to: 0.18 },
      duration: 600,
      ease: "Cubic.easeOut",
    });
  }

  castLine(): FishCatch | null {
    if (this.isEmpty || this._destroyed) return null;

    this.stock = Math.max(0, this.stock - DEPLETE_AMOUNT);
    this.refreshBar();

    if (this.stock <= 0) {
      this.fadeAndDestroy();
      return null;
    }

    // Chance to catch trash based on pollution level (max 40% at full pollution)
    const trashChance = (this.pollutionLevel / 100) * 40;
    if (Phaser.Math.Between(1, 100) <= trashChance) {
      return TRASH_TABLE[Phaser.Math.Between(0, TRASH_TABLE.length - 1)];
    }

    const roll = Phaser.Math.Between(1, 100);
    let cumulative = 0;
    let rarity: keyof typeof RARITY_WEIGHTS = "common";

    for (const [r, weight] of Object.entries(RARITY_WEIGHTS) as [keyof typeof RARITY_WEIGHTS, number][]) {
      cumulative += weight;
      if (roll <= cumulative) { rarity = r; break; }
    }

    const pool = FISH_TABLE.filter(f => f.rarity === rarity);
    return pool.length ? pool[Phaser.Math.Between(0, pool.length - 1)] : null;
  }

  private fadeAndDestroy() {
    this._destroyed = true;
    const body = this.body as Phaser.Physics.Arcade.StaticBody | null;
    if (body) body.enable = false;

    const targets = [this.glowCircle, this.label, this.barBg, this.barFill, this.emptyText];
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

  private refreshBar() {
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

    this.glowCircle.setAlpha(0.05 + 0.25 * pct);
    this.emptyText.setVisible(this.isEmpty);
  }

  destroy(fromScene?: boolean) {
    if (this._destroyed) return;
    this._destroyed = true;
    this.label?.destroy();
    this.glowCircle?.destroy();
    this.barBg?.destroy();
    this.barFill?.destroy();
    this.emptyText?.destroy();
    super.destroy(fromScene);
  }
}