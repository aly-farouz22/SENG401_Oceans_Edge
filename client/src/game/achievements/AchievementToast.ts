import Phaser from "phaser";
import { AchievementDefinition } from "./AchievementDefinitions";

const TOAST_DEPTH    = 200;
const TOAST_DURATION = 3000;
const TOAST_W        = 280;
const TOAST_H        = 64;
const MARGIN         = 16;

export class AchievementToast {
  private scene:    Phaser.Scene;
  private queued:   AchievementDefinition[] = [];
  private showing   = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(def: AchievementDefinition): void {
    this.queued.push(def);
    if (!this.showing) this.next();
  }

  private next(): void {
    const def = this.queued.shift();
    if (!def) { this.showing = false; return; }
    this.showing = true;
    this.render(def);
  }

  private render(def: AchievementDefinition): void {
    const cam     = this.scene.cameras.main;
    const W       = cam.width;
    const startX  = W + TOAST_W / 2 + MARGIN;
    const targetX = W - TOAST_W / 2 - MARGIN;
    const Y       = TOAST_H / 2 + MARGIN;

    // Build everything at (0,0) relative to container
    const bg = this.scene.add.rectangle(0, 0, TOAST_W, TOAST_H, 0x001a2e, 0.95);

    const border = this.scene.add.rectangle(0, 0, TOAST_W, TOAST_H)
      .setStrokeStyle(2, 0xffcc44)
      .setFillStyle(0, 0);

    const icon = this.scene.add.text(-TOAST_W / 2 + 20, 0, def.icon, {
      fontSize: "24px",
    }).setOrigin(0, 0.5);

    const label = this.scene.add.text(-TOAST_W / 2 + 52, -10, "Achievement Unlocked!", {
      fontSize: "10px", color: "#ffcc44",
      fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0, 0.5);

    const name = this.scene.add.text(-TOAST_W / 2 + 52, 8, def.name, {
      fontSize: "14px", color: "#ffffff",
      fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0, 0.5);

    // Single container moves as one unit — no offset math needed
    const container = this.scene.add.container(startX, Y, [bg, border, icon, label, name])
      .setScrollFactor(0)
      .setDepth(TOAST_DEPTH);

    // Slide in from right
    this.scene.tweens.add({
      targets: container,
      x: targetX,
      duration: 350,
      ease: "Back.easeOut",
      onComplete: () => {
        this.scene.time.delayedCall(TOAST_DURATION, () => {
          // Slide back out
          this.scene.tweens.add({
            targets: container,
            x: startX,
            duration: 300,
            ease: "Cubic.easeIn",
            onComplete: () => {
              container.destroy(true);
              this.next();
            },
          });
        });
      },
    });
  }
}