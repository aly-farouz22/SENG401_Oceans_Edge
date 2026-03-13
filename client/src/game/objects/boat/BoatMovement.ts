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
  private keys: { [key: string]: Phaser.Input.Keyboard.Key}
  public speedMultiplier = 1;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
    this.sprite = sprite;
    this.cursors = scene.input.keyboard!.createCursorKeys();
    // WASD support
    this.keys = scene.input.keyboard!.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as {[key: string]: Phaser.Input.Keyboard.Key};
  }

  update(isFishing: boolean) {
    if (isFishing) {
      this.sprite.setVelocity(0);
      return;
    }
    let vx = 0, vy=0;

    this.sprite.setVelocity(0);
    if (this.cursors.left?.isDown)  vx -= 1;
    if (this.cursors.right?.isDown) vx += 1;
    if (this.cursors.up?.isDown)    vy -= 1;
    if (this.cursors.down?.isDown)  vy += 1;
    // Diagonal movement is normazlied, not to be faster than vertical and horizontal movement
    if (vx !==0 && vy !==0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }
    this.sprite.setVelocity(vx * SPEED * this.speedMultiplier, vy * SPEED * this.speedMultiplier)
  }
}