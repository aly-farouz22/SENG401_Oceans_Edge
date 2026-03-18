import Phaser from "phaser";

export interface SeasonCosts {
  fuelCost:        number;
  licenseFee:      number;
  maintenanceCost: number;
  earnings:        number;
  currentBalance:  number;
}

export default class SeasonEndScreen {
  private scene:     Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;

  public onComplete?: (canContinue: boolean) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(costs: SeasonCosts) {
    const W  = this.scene.cameras.main.width;
    const H  = this.scene.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;
    const PW = 480;
    const PH = 560;
    const DEPTH = 150;

    const overlay = this.scene.add.rectangle(cx, cy, W, H, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(DEPTH);

    const panel = this.scene.add.rectangle(cx, cy, PW, PH, 0x001a2e, 1)
      .setScrollFactor(0).setDepth(DEPTH + 1);

    const border = this.scene.add.rectangle(cx, cy, PW, PH)
      .setStrokeStyle(3, 0xffcc44, 1).setFillStyle(0, 0)
      .setScrollFactor(0).setDepth(DEPTH + 2);

    const title = this.scene.add.text(cx, cy - PH / 2 + 30, "📋 Season Summary", {
      fontSize: "22px", fontStyle: "bold", color: "#ffdd88",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3);

    const divider = this.scene.add.rectangle(cx, cy - PH / 2 + 58, PW - 40, 1, 0xffcc44, 0.4)
      .setScrollFactor(0).setDepth(DEPTH + 3);

    // Current balance row
    const balanceText = this.scene.add.text(cx - PW / 2 + 30, cy - 170,
      `🏦 Current Balance`, {
      fontSize: "16px", color: "#a0e8ff",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
    }).setScrollFactor(0).setDepth(DEPTH + 3).setAlpha(0);

    const balanceVal = this.scene.add.text(cx + PW / 2 - 30, cy - 170,
      `$${costs.currentBalance}`, {
      fontSize: "16px", color: "#a0e8ff",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH + 3).setAlpha(0);

    // Earnings row
    const earningsText = this.scene.add.text(cx - PW / 2 + 30, cy - 120,
      `💰 Fish Sales`, {
      fontSize: "16px", color: "#44ff88",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
    }).setScrollFactor(0).setDepth(DEPTH + 3).setAlpha(0);

    const earningsVal = this.scene.add.text(cx + PW / 2 - 30, cy - 120,
      `+ $${costs.earnings}`, {
      fontSize: "16px", color: "#44ff88",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH + 3).setAlpha(0);

    // Cost rows
    const costRows = [
      { label: "⛽ Fuel Cost",    value: costs.fuelCost,        color: "#ff8844" },
      { label: "📜 License Fee",  value: costs.licenseFee,      color: "#ff8844" },
      { label: "🔧 Maintenance",  value: costs.maintenanceCost, color: "#ff8844" },
    ];

    const rowTexts: { label: Phaser.GameObjects.Text, val: Phaser.GameObjects.Text }[] = [];

    costRows.forEach((row, i) => {
      const rowY = cy - 60 + i * 50;

      const label = this.scene.add.text(cx - PW / 2 + 30, rowY, row.label, {
        fontSize: "16px", color: row.color,
        fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
      }).setScrollFactor(0).setDepth(DEPTH + 3).setAlpha(0);

      const val = this.scene.add.text(cx + PW / 2 - 30, rowY, `- $${row.value}`, {
        fontSize: "16px", color: row.color,
        fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH + 3).setAlpha(0);

      rowTexts.push({ label, val });
    });

    // Total divider
    const totalDivider = this.scene.add.rectangle(cx, cy + 110, PW - 40, 1, 0xffffff, 0.2)
      .setScrollFactor(0).setDepth(DEPTH + 3).setAlpha(0);

    // Net calculation includes current balance
    const totalCosts = costs.fuelCost + costs.licenseFee + costs.maintenanceCost;
    const net        = (costs.currentBalance + costs.earnings) - totalCosts;
    const netColor   = net >= 0 ? "#44ff88" : "#ff4444";

    const netLabel = this.scene.add.text(cx - PW / 2 + 30, cy + 125, "Final Balance", {
      fontSize: "18px", fontStyle: "bold", color: netColor,
      fontFamily: "monospace", stroke: "#000", strokeThickness: 3,
    }).setScrollFactor(0).setDepth(DEPTH + 3).setAlpha(0);

    const netVal = this.scene.add.text(cx + PW / 2 - 30, cy + 125,
      `$${net}`, {
      fontSize: "18px", fontStyle: "bold", color: netColor,
      fontFamily: "monospace", stroke: "#000", strokeThickness: 3,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH + 3).setAlpha(0);

    // Result message
    const resultMsg   = net < 0
      ? "💀 You couldn't cover your costs!\nGame Over."
      : "✅ Costs covered! Season complete.";
    const resultColor = net < 0 ? "#ff4444" : "#44ff88";

    const resultText = this.scene.add.text(cx, cy + 185, resultMsg, {
      fontSize: "15px", fontStyle: "bold", color: resultColor,
      fontFamily: "monospace", stroke: "#000", strokeThickness: 3,
      align: "center",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 3).setAlpha(0);

    // Button
    const btnLabel = net < 0 ? "💀 Game Over" : "➡ Continue";
    const btnColor = net < 0 ? "#ff4444" : "#44ff88";
    const continueBtn = this.scene.add.text(cx, cy + PH / 2 - 30, btnLabel, {
      fontSize: "16px", color: btnColor,
      fontFamily: "monospace", stroke: "#000", strokeThickness: 3,
      backgroundColor: "#0a2a3a", padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3).setAlpha(0)
      .setInteractive({ useHandCursor: true });

    // Animate panel in
    const base = [overlay, panel, border, title, divider];
    base.forEach(o => o.setAlpha(0));
    this.scene.tweens.add({
      targets: base, alpha: 1, duration: 300, ease: "Cubic.easeOut",
    });

    // Animate balance
    this.scene.time.delayedCall(300, () => {
      this.scene.tweens.add({
        targets: [balanceText, balanceVal], alpha: 1, duration: 300, ease: "Cubic.easeOut",
      });
    });

    // Animate earnings
    this.scene.time.delayedCall(600, () => {
      this.scene.tweens.add({
        targets: [earningsText, earningsVal], alpha: 1, duration: 300, ease: "Cubic.easeOut",
      });
    });

    // Animate each cost row one by one
    rowTexts.forEach(({ label, val }, i) => {
      this.scene.time.delayedCall(900 + i * 400, () => {
        this.scene.tweens.add({
          targets: [label, val], alpha: 1, duration: 300, ease: "Cubic.easeOut",
        });
      });
    });

    // Animate total
    const afterRows = 900 + rowTexts.length * 400;
    this.scene.time.delayedCall(afterRows, () => {
      this.scene.tweens.add({
        targets: [totalDivider, netLabel, netVal], alpha: 1, duration: 300, ease: "Cubic.easeOut",
      });
    });

    // Animate result + button
    this.scene.time.delayedCall(afterRows + 500, () => {
      this.scene.tweens.add({
        targets: [resultText, continueBtn], alpha: 1, duration: 300, ease: "Cubic.easeOut",
      });

      continueBtn.on("pointerdown", () => {
        this.dismiss();
        this.onComplete?.(net >= 0);
      });
      continueBtn.on("pointerover",  () => continueBtn.setAlpha(0.75));
      continueBtn.on("pointerout",   () => continueBtn.setAlpha(1));
    });
  }

  private dismiss() {
    const allObjects = this.scene.children.list.filter(
      obj => (obj as any).depth >= 150
    );
    this.scene.tweens.add({
      targets: allObjects,
      alpha: 0, duration: 200,
      onComplete: () => allObjects.forEach(o => (o as Phaser.GameObjects.GameObject).destroy()),
    });
  }
}