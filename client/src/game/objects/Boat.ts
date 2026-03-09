import Phaser from "phaser";

export default class Boat extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "boat");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.cursors = scene.input.keyboard.createCursorKeys();
  }

  update() {
    const speed = 200;

    this.setVelocity(0);

    if (this.cursors.left?.isDown) this.setVelocityX(-speed);
    if (this.cursors.right?.isDown) this.setVelocityX(speed);
    if (this.cursors.up?.isDown) this.setVelocityY(-speed);
    if (this.cursors.down?.isDown) this.setVelocityY(speed);
  }
}