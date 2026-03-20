import Phaser from "phaser";
import { FuelSystem } from "../../systems/FuelSystem";

const SPEED = 200;

export default class BoatMovement {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private sprite:  Phaser.Physics.Arcade.Sprite;
  private keys:    { [key: string]: Phaser.Input.Keyboard.Key };
  public  speedMultiplier = 1;

  fuelSystem?: FuelSystem;
  onFuelEmpty?: () => void;

  private _fuelEmptyFired = false;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
    this.sprite  = sprite;
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keys    = scene.input.keyboard!.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as { [key: string]: Phaser.Input.Keyboard.Key };
  }

  update(isFishing: boolean, delta = 16) {
    if (isFishing) {
      this.sprite.setVelocity(0);
      return;
    }

    if (this.fuelSystem && !this.fuelSystem.canMove()) {
      this.sprite.setVelocity(0);
      if (!this._fuelEmptyFired) {
        this._fuelEmptyFired = true;
        this.onFuelEmpty?.();
      }
      return;
    }

    // Reset flag once fuel is restored
    this._fuelEmptyFired = false;

    let vx = 0, vy = 0;

    if (this.cursors.left?.isDown  || this.keys.a?.isDown) vx -= 1;
    if (this.cursors.right?.isDown || this.keys.d?.isDown) vx += 1;
    if (this.cursors.up?.isDown    || this.keys.w?.isDown) vy -= 1;
    if (this.cursors.down?.isDown  || this.keys.s?.isDown) vy += 1;

    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    if (vx !== 0 || vy !== 0) {
      const angle = Math.atan2(vy, vx) * Phaser.Math.RAD_TO_DEG;
      this.sprite.setAngle(angle - 90);
      this.fuelSystem?.drain(delta);
    }

    this.sprite.setVelocity(
      vx * SPEED * this.speedMultiplier,
      vy * SPEED * this.speedMultiplier
    );
  }
}