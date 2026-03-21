// ─────────────────────────────────────────────────────────────────────────────
// SeasonObjectivePopup.ts
//
// Shows at the start of each season — displays that season's objectives
// and long-term progress.
//
// Usage:
//   const popup = new SeasonObjectivePopup(scene);
//   popup.show(objectiveSystem, season);
//   popup.onClose = () => { /* resume game */ };
// ─────────────────────────────────────────────────────────────────────────────

import Phaser from "phaser";
import ObjectiveSystem, { Objective } from "../systems/ObjectiveSystem";

const DEPTH = 170;

export default class SeasonObjectivePopup {
  private scene:   Phaser.Scene;
  private objects: Phaser.GameObjects.GameObject[] = [];

  public onClose?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(objectiveSystem: ObjectiveSystem, season: number): void {
    const cam = this.scene.cameras.main;
    const W   = cam.width;
    const H   = cam.height;
    const cx  = W / 2;
    const cy  = H / 2;

    const seasonObjs   = objectiveSystem.getSeasonObjectives();
    const longTermObjs = objectiveSystem.getLongTermObjectives();

    const PW  = 520;
    const PH  = 420;

    // ── Overlay ──
    this.add(this.scene.add.rectangle(cx, cy, W, H, 0x000000, 0.82)
      .setScrollFactor(0).setDepth(DEPTH));

    // ── Panel ──
    this.add(this.scene.add.rectangle(cx, cy, PW, PH, 0x001a2e)
      .setScrollFactor(0).setDepth(DEPTH + 1));
    this.add(this.scene.add.rectangle(cx, cy, PW, PH)
      .setStrokeStyle(2, 0xffcc44).setFillStyle(0, 0)
      .setScrollFactor(0).setDepth(DEPTH + 2));

    // ── Title ──
    this.add(this.scene.add.text(cx, cy - PH / 2 + 24,
      `🎯  Season ${season} Objectives`, {
      fontSize: "18px", fontStyle: "bold", color: "#ffdd88",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3));

    this.add(this.scene.add.rectangle(cx, cy - PH / 2 + 52, PW - 40, 1, 0xffcc44, 0.3)
      .setScrollFactor(0).setDepth(DEPTH + 3));

    // ── Season objectives ──
    this.add(this.scene.add.text(cx - PW / 2 + 24, cy - PH / 2 + 62,
      "This Season", {
      fontSize: "11px", color: "#667788", fontFamily: "monospace",
    }).setScrollFactor(0).setDepth(DEPTH + 3));

    seasonObjs.forEach((obj, i) => {
      const rowY = cy - PH / 2 + 84 + i * 44;
      this.buildObjectiveRow(obj, cx, rowY, PW, false);
    });

    // ── Divider ──
    const divY = cy - PH / 2 + 84 + seasonObjs.length * 44 + 8;
    this.add(this.scene.add.rectangle(cx, divY, PW - 40, 1, 0xffffff, 0.1)
      .setScrollFactor(0).setDepth(DEPTH + 3));

    // ── Long-term objectives ──
    this.add(this.scene.add.text(cx - PW / 2 + 24, divY + 10,
      "Long-term Goals", {
      fontSize: "11px", color: "#667788", fontFamily: "monospace",
    }).setScrollFactor(0).setDepth(DEPTH + 3));

    longTermObjs.forEach((obj, i) => {
      const rowY = divY + 30 + i * 38;
      this.buildObjectiveRow(obj, cx, rowY, PW, true);
    });

    // ── Start button ──
    const btn = this.scene.add.text(cx, cy + PH / 2 - 28, "▶  Start Season", {
      fontSize: "15px", color: "#44ff88", fontFamily: "monospace",
      fontStyle: "bold", stroke: "#000", strokeThickness: 2,
      backgroundColor: "#0a2a3a", padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 4)
      .setInteractive({ useHandCursor: true });

    btn.on("pointerover", () => btn.setAlpha(0.75));
    btn.on("pointerout",  () => btn.setAlpha(1));
    btn.on("pointerdown", () => this.dismiss());
    this.add(btn);

    // ── Fade in ──
    this.objects.forEach(o => (o as any).setAlpha?.(0));
    this.scene.tweens.add({
      targets: this.objects, alpha: 1, duration: 250, ease: "Cubic.easeOut",
    });
  }

  private buildObjectiveRow(
    obj: Objective, cx: number, rowY: number, PW: number, compact: boolean
  ): void {
    const isPass    = obj.isAvoid ? !obj.failed : obj.completed;
    const statusIcon = obj.failed ? "❌" : obj.completed ? "✅" : "⬜";
    const barColor   = obj.failed ? 0xff4444 : obj.completed ? 0x44ff88 : 0x334455;
    const textColor  = obj.failed ? "#ff6666" : obj.completed ? "#88ffaa" : "#a0c8dd";
    const H          = compact ? 28 : 34;

    // Row background
    this.add(this.scene.add.rectangle(cx, rowY, PW - 32, H, 0x000d1a, 0.5)
      .setScrollFactor(0).setDepth(DEPTH + 3));

    // Left accent bar
    this.add(this.scene.add.rectangle(cx - PW / 2 + 20, rowY, 3, H, barColor)
      .setScrollFactor(0).setDepth(DEPTH + 4));

    // Icon + label
    this.add(this.scene.add.text(cx - PW / 2 + 30, rowY,
      `${obj.icon}  ${obj.label}`, {
      fontSize: compact ? "11px" : "13px", color: textColor,
      fontFamily: "monospace", fontStyle: obj.completed ? "bold" : "normal",
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(DEPTH + 4));

    // Progress / status on the right
    let rightText: string;
    if (obj.isAvoid) {
      rightText = obj.failed ? "FAILED" : "✓ Safe";
    } else if (obj.id === "ecosystem_health") {
      rightText = `${obj.current.toFixed(0)}% / ${obj.target}%`;
    } else {
      rightText = `${Math.min(obj.current, obj.target)} / ${obj.target}`;
    }

    this.add(this.scene.add.text(cx + PW / 2 - 28, rowY, rightText, {
      fontSize: compact ? "10px" : "12px",
      color: obj.failed ? "#ff4444" : obj.completed ? "#44ff88" : "#556677",
      fontFamily: "monospace",
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(DEPTH + 4));

    // Progress bar (non-avoid, non-compact)
    if (!obj.isAvoid && !compact) {
      const barW   = 80;
      const ratio  = Math.min(obj.current / Math.max(obj.target, 1), 1);
      this.add(this.scene.add.rectangle(cx + PW / 2 - 110, rowY + 10, barW, 4, 0x112233)
        .setScrollFactor(0).setDepth(DEPTH + 4));
      this.add(this.scene.add.rectangle(
        cx + PW / 2 - 110 - barW / 2 + (barW * ratio) / 2,
        rowY + 10, Math.max(barW * ratio, 1), 4, barColor
      ).setScrollFactor(0).setDepth(DEPTH + 4));
    }
  }

  private dismiss(): void {
    this.scene.tweens.add({
      targets: this.objects, alpha: 0, duration: 180, ease: "Cubic.easeIn",
      onComplete: () => {
        this.objects.forEach(o => o.destroy());
        this.objects = [];
        this.onClose?.();
      },
    });
  }

  private add<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.objects.push(obj);
    return obj;
  }
}