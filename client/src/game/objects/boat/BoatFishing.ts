import Phaser from "phaser";
import FishingZone, { FishCatch } from "../FishingZone";

const CAST_DURATION = 2000;

const RARITY_COLORS: Record<string, string> = {
  common:    "#ffffff",
  uncommon:  "#44ff88",
  rare:      "#4488ff",
  legendary: "#ffcc00",
};

/**
 * Manages the fishing mini-loop.
 * Call update() each frame, passing the active zone the boat is currently in.
 * onCatch is fired when a fish is successfully reeled in.
 */
export default class BoatFishing {
  private scene: Phaser.Scene;
  private sprite: Phaser.Physics.Arcade.Sprite;
  private spaceKey: Phaser.Input.Keyboard.Key;

  private fishingZones: FishingZone[] = [];
  private activeZone: FishingZone | null = null; // zone captured at cast time

  private _isFishing = false;
  get isFishing() { return this._isFishing; }

  private promptText: Phaser.GameObjects.Text;
  private catchText:  Phaser.GameObjects.Text;
  private barBg: Phaser.GameObjects.Rectangle;
  private bar:   Phaser.GameObjects.Rectangle;
  public catchMultiplier = 1;
  public ecoFilterLevel = 0;

  onCatch?: (fish: FishCatch) => void;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
    this.scene  = scene;
    this.sprite = sprite;

    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.promptText = scene.add.text(0, 0, "SPACE to fish", {
      fontSize: "13px", color: "#a0e8ff",
      stroke: "#002233", strokeThickness: 3, fontFamily: "monospace",
    }).setOrigin(0.5, 1).setVisible(false).setDepth(10);

    this.catchText = scene.add.text(0, 0, "", {
      fontSize: "16px", fontStyle: "bold", fontFamily: "monospace",
      stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5, 1).setDepth(11);

    this.barBg = scene.add.rectangle(0, 0, 60, 8, 0x003344)
      .setDepth(10).setVisible(false);
    this.bar = scene.add.rectangle(0, 0, 0, 8, 0x00aaff)
      .setOrigin(0, 0.5).setDepth(11).setVisible(false);
  }

  registerZones(zones: FishingZone[]) {
    this.fishingZones = zones;
  }

  /**
   * @param activeZone - the specific zone the boat is overlapping right now, or null
   * @param isAtMarket - suppresses fishing when at the market
   */
  update(activeZone: FishingZone | null, isAtMarket: boolean) {
    const { x, y } = this.sprite;
    const isInZone = activeZone !== null;

    this.promptText
      .setPosition(x, y - 28)
      .setVisible(isInZone && !this._isFishing && !isAtMarket);

    this.barBg.setPosition(x, y - 44);
    this.bar.setPosition(x - 30, y - 44);

    if (isInZone && !this._isFishing && !isAtMarket &&
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.activeZone = activeZone; // lock in the zone at cast time
      this.cast();
    }
  }

  private cast() {
    this._isFishing = true;
    this.sprite.setVelocity(0);
    this.promptText.setVisible(false);

    this.barBg.setVisible(true);
    this.bar.setVisible(true).setDisplaySize(0, 8);

    this.scene.tweens.add({
      targets: this.bar, displayWidth: 60,
      duration: CAST_DURATION, ease: "Linear",
    });

    this.scene.time.delayedCall(CAST_DURATION, () => this.reelIn());
  }

  private reelIn() {
    this.barBg.setVisible(false);
    this.bar.setVisible(false);

    // Use the zone that was active when the cast started
    const fish = this.activeZone?.castLine() ?? null;

    if (fish) {
      // Catch multiplier is added
      fish.amount *= this.catchMultiplier;
      this.showCatchPopup(fish);
      this.onCatch?.(fish);
    }

    this.activeZone = null;
    this.scene.time.delayedCall(800, () => { this._isFishing = false; });
  }

  private showCatchPopup(fish: FishCatch) {
    const color = RARITY_COLORS[fish.rarity] ?? "#ffffff";
    const emoji = fish.rarity === "legendary" ? "🌟" : "🐟";
    const { x, y } = this.sprite;

    this.catchText
      .setText(`${emoji} ${fish.name}!`)
      .setColor(color)
      .setPosition(x, y - 55)
      .setAlpha(1).setVisible(true);

    this.scene.tweens.add({
      targets: this.catchText,
      y: this.catchText.y - 40, alpha: 0,
      duration: 1800, ease: "Cubic.easeOut",
      onComplete: () => this.catchText.setVisible(false),
    });
  }
}