import Phaser from "phaser";
import CatchPopup from "../CatchPopup";
import FishingZone, { FishCatch } from "../FishingZone";

const CAST_DURATION = 2000;

export default class BoatFishing {
  private scene:    Phaser.Scene;
  private sprite:   Phaser.Physics.Arcade.Sprite;
  private spaceKey: Phaser.Input.Keyboard.Key;
  private popup:    CatchPopup;

  private fishingZones: FishingZone[] = [];
  private activeZone:   FishingZone | null = null;

  private _isFishing = false;
  get isFishing() { return this._isFishing; }

  catchMultiplier = 1;
  ecoFilterLevel  = 0;

  private promptText: Phaser.GameObjects.Text;
  private barBg:      Phaser.GameObjects.Rectangle;
  private bar:        Phaser.GameObjects.Rectangle;

  onCatch?: (fish: FishCatch) => void;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
    this.scene  = scene;
    this.sprite = sprite;
    this.popup  = new CatchPopup(scene);

    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.promptText = scene.add.text(0, 0, "SPACE to fish", {
      fontSize: "13px", color: "#a0e8ff",
      stroke: "#002233", strokeThickness: 3, fontFamily: "monospace",
    }).setOrigin(0.5, 1).setVisible(false).setDepth(10);

    this.barBg = scene.add.rectangle(0, 0, 60, 8, 0x003344)
      .setDepth(10).setVisible(false);
    this.bar = scene.add.rectangle(0, 0, 0, 8, 0x00aaff)
      .setOrigin(0, 0.5).setDepth(11).setVisible(false);
  }

  registerZones(zones: FishingZone[]) {
    this.fishingZones = zones;
  }

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
      this.activeZone = activeZone;
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

    const fish = this.activeZone?.castLine() ?? null;

    if (fish) {
      this.popup.show(fish);
      this.onCatch?.(fish);
    }

    this.activeZone = null;
    this.scene.time.delayedCall(800, () => { this._isFishing = false; });
  }
}