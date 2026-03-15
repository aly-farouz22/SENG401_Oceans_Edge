import Phaser from "phaser";
import { FishCatch } from "./FishingZone";
import BoatUpgrade from "./boat/BoatUpgrade";

export type MarketChoice = "sell" | "upgrade" | "end_season" | "cancel";

export default class MarketZone extends Phaser.GameObjects.Zone {
  private glowRect:   Phaser.GameObjects.Rectangle;
  private glowBorder: Phaser.GameObjects.Rectangle;
  private label:      Phaser.GameObjects.Text;

  private overlay!:      Phaser.GameObjects.Rectangle;
  private panel!:        Phaser.GameObjects.Rectangle;
  private panelBorder!:  Phaser.GameObjects.Rectangle;
  private titleText!:    Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private btnSell!:      Phaser.GameObjects.Text;
  private btnEndSeason!: Phaser.GameObjects.Text;
  private btnCancel!:    Phaser.GameObjects.Text;
  private btnUpgrade!:   Phaser.GameObjects.Text;
  private divider!:      Phaser.GameObjects.Rectangle;

  // Upgrade panel elements
  private upgradePanel!:       Phaser.GameObjects.Rectangle;
  private upgradePanelBorder!: Phaser.GameObjects.Rectangle;
  private upgradeTitleText!:   Phaser.GameObjects.Text;
  private upgradeItems:        Phaser.GameObjects.Text[] = [];
  private upgradeBtns:         Phaser.GameObjects.Text[] = [];
  private upgradeBackBtn!:     Phaser.GameObjects.Text;
  private upgradeOverlay!:     Phaser.GameObjects.Rectangle;

  private _menuOpen = false;
  get menuOpen() { return this._menuOpen; }

  private boatUpgrade: BoatUpgrade | null = null;

  onChoice?: (choice: MarketChoice, inventory: FishCatch[]) => void;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    width = 120, height = 80,
    name = "Market Dock"
  ) {
    super(scene, x, y, width, height);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.glowRect = scene.add.rectangle(x, y, width, height, 0xffaa00, 0.15);
    this.glowBorder = scene.add.rectangle(x, y, width, height)
      .setStrokeStyle(2, 0xffcc44, 0.8).setFillStyle(0, 0);

    scene.tweens.add({
      targets: [this.glowRect, this.glowBorder],
      alpha: { from: 0.15, to: 0.45 },
      duration: 1000, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    this.label = scene.add.text(x, y - height / 2 - 14, `🏪 ${name}`, {
      fontSize: "13px", color: "#ffdd88",
      stroke: "#332200", strokeThickness: 3, fontFamily: "monospace",
    }).setOrigin(0.5, 1).setDepth(10);

    this.buildOverlay(scene);
    this.buildUpgradePanel(scene);
  }

  registerUpgrades(boatUpgrade: BoatUpgrade) {
    this.boatUpgrade = boatUpgrade;
  }

  private buildOverlay(scene: Phaser.Scene) {
    const cam = scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const PW = 360, PH = 350, DEPTH = 100;

    this.overlay = scene.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.65)
      .setScrollFactor(0).setDepth(DEPTH).setVisible(false).setInteractive();

    this.panel = scene.add.rectangle(cx, cy, PW, PH, 0x001a2e, 1)
      .setScrollFactor(0).setDepth(DEPTH + 1).setVisible(false);

    this.panelBorder = scene.add.rectangle(cx, cy, PW, PH)
      .setStrokeStyle(2, 0xffcc44, 1).setFillStyle(0, 0)
      .setScrollFactor(0).setDepth(DEPTH + 2).setVisible(false);

    this.titleText = scene.add.text(cx, cy - 100, "🏪 Market Dock", {
      fontSize: "22px", fontStyle: "bold", color: "#ffdd88",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3).setVisible(false);

    this.subtitleText = scene.add.text(cx, cy - 60, "", {
      fontSize: "13px", color: "#a0e8ff",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3).setVisible(false);

    this.divider = scene.add.rectangle(cx, cy - 36, PW - 40, 1, 0xffcc44, 0.4)
      .setScrollFactor(0).setDepth(DEPTH + 3).setVisible(false);
    const spacing = 50;
    this.btnSell      = this.makeButton(scene, cx, cy - spacing+40, "💰  Sell Fish",          "#44ff88", DEPTH + 3);
    this.btnUpgrade   = this.makeButton(scene, cx, cy+40, "⚙  Buy Upgrades",        "#66ccff", DEPTH + 3);
    this.btnEndSeason = this.makeButton(scene, cx, cy + spacing+40, "🌿  End Season & Sell",  "#ffaa44", DEPTH + 3);
    this.btnCancel    = this.makeButton(scene, cx, cy + spacing * 2+40,"✖  Cancel",              "#ff6666", DEPTH + 3);
  }

  private buildUpgradePanel(scene: Phaser.Scene) {
    const cam = scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const PW = 700, PH = 380, DEPTH = 110;

    this.upgradeOverlay = scene.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(DEPTH).setVisible(false).setInteractive();

    this.upgradePanel = scene.add.rectangle(cx, cy, PW, PH, 0x001a2e, 1)
      .setScrollFactor(0).setDepth(DEPTH + 1).setVisible(false);

    this.upgradePanelBorder = scene.add.rectangle(cx, cy, PW, PH)
      .setStrokeStyle(2, 0x66ccff, 1).setFillStyle(0, 0)
      .setScrollFactor(0).setDepth(DEPTH + 2).setVisible(false);

    this.upgradeTitleText = scene.add.text(cx, cy - PH / 2 + 24, "⚙ Upgrades", {
      fontSize: "20px", fontStyle: "bold", color: "#66ccff",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 3).setVisible(false);

    this.upgradeBackBtn = this.makeButton(scene, cx, cy + PH / 2 - 28, "← Back", "#ff6666", DEPTH + 3);
    this.upgradeBackBtn.setVisible(false);
  }

  private makeButton(scene: Phaser.Scene, x: number, y: number, label: string, color: string, depth: number): Phaser.GameObjects.Text {
    return scene.add.text(x, y, label, {
      fontSize: "16px", color, fontFamily: "monospace",
      stroke: "#000", strokeThickness: 3,
      backgroundColor: "#0a2a3a", padding: { x: 24, y: 10 },
    })
    .setOrigin(0.5).setScrollFactor(0).setDepth(depth).setVisible(false)
    .setInteractive({ useHandCursor: true })
    .on("pointerover",  function(this: Phaser.GameObjects.Text) { this.setAlpha(0.75); })
    .on("pointerout",   function(this: Phaser.GameObjects.Text) { this.setAlpha(1); });
  }

  showMenu(inventory: FishCatch[]) {
    if (this._menuOpen) return;
    this._menuOpen = true;

    const total = inventory.reduce((s, f) => s + f.points, 0);
    const count = inventory.length;
    this.subtitleText.setText(
      count > 0 ? `You have ${count} fish worth $${total}` : "Your inventory is empty"
    );

    this.btnSell.removeAllListeners("pointerdown");
    this.btnEndSeason.removeAllListeners("pointerdown");
    this.btnCancel.removeAllListeners("pointerdown");
    this.btnUpgrade.removeAllListeners("pointerdown");

    this.btnSell.on("pointerdown",      () => { this.hideMenu(); this.onChoice?.("sell",       inventory); });
    this.btnEndSeason.on("pointerdown", () => { this.hideMenu(); this.onChoice?.("end_season", inventory); });
    this.btnCancel.on("pointerdown",    () => { this.hideMenu(); this.onChoice?.("cancel",     inventory); });
    this.btnUpgrade.on("pointerdown",   () => { this.showUpgradePanel(inventory); });

    const all = [this.overlay, this.panel, this.panelBorder, this.titleText,
                 this.subtitleText, this.divider, this.btnSell, this.btnUpgrade,
                 this.btnEndSeason, this.btnCancel];
    all.forEach(el => el.setVisible(true).setAlpha(0));
    this.scene.tweens.add({ targets: all, alpha: 1, duration: 200, ease: "Cubic.easeOut" });
  }

  private showUpgradePanel(inventory: FishCatch[]) {
    // Hide main menu
    const mainAll = [this.overlay, this.panel, this.panelBorder, this.titleText,
                     this.subtitleText, this.divider, this.btnSell, this.btnUpgrade,
                     this.btnEndSeason, this.btnCancel];
    mainAll.forEach(el => el.setVisible(false));

    // Destroy old upgrade item rows
    this.upgradeItems.forEach(t => t.destroy());
    this.upgradeBtns.forEach(t => t.destroy());
    this.upgradeItems = [];
    this.upgradeBtns  = [];

    const cam = this.scene.cameras.main;
    const cx  = cam.width / 2;
    const cy  = cam.height / 2;
    const PH  = 380;
    const DEPTH = 113;

    const upgrades = this.boatUpgrade?.displayUpgrades() ?? [];
    const startY   = cy - PH / 2 + 70;

    upgrades.forEach((u, i) => {
      const rowY     = startY + i * 76;
      const maxed    = u.level >= u.maxLevel;
      const labelStr = `${u.name}  [${u.level}/${u.maxLevel}]\n${u.description}\nCost: $${u.cost}`;

      const infoText = this.scene.add.text(cx - 80, rowY, labelStr, {
        fontSize: "12px", color: maxed ? "#556677" : "#a0e8ff",
        fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
        lineSpacing: 4,
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(DEPTH).setAlpha(0);

      const buyBtn = this.makeButton(this.scene, cx + 160, rowY,
        maxed ? "MAX" : "Buy",
        maxed ? "#445566" : "#44ff88", DEPTH);

      if (!maxed) {
        buyBtn.on("pointerdown", () => {
          const ok = this.boatUpgrade?.purchaseUpgrade(u.name);
          if (ok) {
            // Refresh panel after purchase
            this.showUpgradePanel(inventory);
          } else {
            // Flash red to indicate can't afford
            buyBtn.setColor("#ff4444");
            this.scene.time.delayedCall(400, () => buyBtn.setColor("#44ff88"));
          }
        });
      }

      this.upgradeItems.push(infoText);
      this.upgradeBtns.push(buyBtn);
    });

    // Back button
    this.upgradeBackBtn.removeAllListeners("pointerdown");
    this.upgradeBackBtn.on("pointerdown", () => {
      this.hideUpgradePanel();
      // Re-show main menu
      const all = [this.overlay, this.panel, this.panelBorder, this.titleText,
                   this.subtitleText, this.divider, this.btnSell, this.btnUpgrade,
                   this.btnEndSeason, this.btnCancel];
      all.forEach(el => el.setVisible(true).setAlpha(1));
    });

    const allUpgrade = [this.upgradeOverlay, this.upgradePanel, this.upgradePanelBorder,
                        this.upgradeTitleText, this.upgradeBackBtn,
                        ...this.upgradeItems, ...this.upgradeBtns];
    allUpgrade.forEach(el => el.setVisible(true).setAlpha(0));
    this.scene.tweens.add({ targets: allUpgrade, alpha: 1, duration: 200, ease: "Cubic.easeOut" });
  }

  private hideUpgradePanel() {
    const all = [this.upgradeOverlay, this.upgradePanel, this.upgradePanelBorder,
                 this.upgradeTitleText, this.upgradeBackBtn,
                 ...this.upgradeItems, ...this.upgradeBtns];
    all.forEach(el => el.setVisible(false));
  }

  hideMenu() {
    if (!this._menuOpen) return;
    this._menuOpen = false;

    this.hideUpgradePanel();

    const all = [this.overlay, this.panel, this.panelBorder, this.titleText,
                 this.subtitleText, this.divider, this.btnSell, this.btnUpgrade,
                 this.btnEndSeason, this.btnCancel];

    this.scene.tweens.add({
      targets: all, alpha: 0, duration: 150,
      onComplete: () => all.forEach(el => el.setVisible(false)),
    });
  }

  sellAll(inventory: FishCatch[]): number {
    return inventory.reduce((sum, f) => sum + f.points, 0);
  }

  destroy(fromScene?: boolean) {
    this.label?.destroy();
    this.glowRect?.destroy();
    this.glowBorder?.destroy();
    this.overlay?.destroy();
    this.panel?.destroy();
    this.panelBorder?.destroy();
    this.titleText?.destroy();
    this.subtitleText?.destroy();
    this.divider?.destroy();
    this.btnSell?.destroy();
    this.btnUpgrade?.destroy();
    this.btnEndSeason?.destroy();
    this.btnCancel?.destroy();
    this.upgradeOverlay?.destroy();
    this.upgradePanel?.destroy();
    this.upgradePanelBorder?.destroy();
    this.upgradeTitleText?.destroy();
    this.upgradeBackBtn?.destroy();
    this.upgradeItems.forEach(t => t.destroy());
    this.upgradeBtns.forEach(t => t.destroy());
    super.destroy(fromScene);
  }
}