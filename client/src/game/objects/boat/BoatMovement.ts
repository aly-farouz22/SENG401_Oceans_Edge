import Phaser from "phaser";

const SPEED = 200;

/**
 * Handles arrow-key movement for the boat.
 * Call update() each frame, passing isFishing so movement
 * can be locked while the player is reeling in a catch.
 */
export default class BoatMovement {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private sprite: Phaser.Physics.Arcade.Sprite;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
    this.sprite = sprite;
    this.cursors = scene.input.keyboard!.createCursorKeys();
  }

  update(isFishing: boolean) {
    if (isFishing) return;

    this.sprite.setVelocity(0);
    if (this.cursors.left?.isDown)  this.sprite.setVelocityX(-SPEED);
    if (this.cursors.right?.isDown) this.sprite.setVelocityX(SPEED);
    if (this.cursors.up?.isDown)    this.sprite.setVelocityY(-SPEED);
    if (this.cursors.down?.isDown)  this.sprite.setVelocityY(SPEED);
  }
}