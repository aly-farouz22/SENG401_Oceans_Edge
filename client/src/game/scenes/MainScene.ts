import Phaser from "phaser";
import Boat from "../objects/Boat";

export default class MainScene extends Phaser.Scene {
  private boat!: Boat;

  constructor() {
    super("MainScene");
  }

  preload() {
    this.load.image("boat", "/assets/boat.png");
  }

  create() {
    this.boat = new Boat(this, 400, 300);
  }

  update() {
    this.boat.update();
  }
}