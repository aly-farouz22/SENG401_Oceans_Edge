import Phaser from "phaser";
import { ACHIEVEMENTS, AchievementDefinition } from "./AchievementDefinitions";
import { AchievementManager } from "./AchievementManager";

const DEPTH = 160;
const COLS  = 4;
const CELL_W     = 110;
const CELL_H     = 110;
const CELL_GAP_X = 12;
const CELL_GAP_Y = 12;
const PAD        = 24;

const CATEGORY_COLORS: Record<string, number> = {
  catch:    0x44ccff,
  profit:   0x44ff88,
  survival: 0xffaa44,
  ecology:  0x44ffcc,
  upgrades: 0xff8844,
  ending:   0xff4466,
};

export default class BadgeGalleryScreen {
  private scene:         Phaser.Scene;
  private allObjects:    Phaser.GameObjects.GameObject[] = [];
  private cellObjects:   Phaser.GameObjects.GameObject[] = [];
  private tabObjects:    Phaser.GameObjects.GameObject[] = [];
  private activeCategory = "all";

  private cx        = 0;
  private gridTopY  = 0;
  private PW        = 0;
  private panelBg!:  Phaser.GameObjects.Rectangle;
  private panelBdr!: Phaser.GameObjects.Rectangle;
  private closeBtnY = 0;
  private closeBtn!: Phaser.GameObjects.Text;

  public onClose?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(): void {
    this.build();
  }

  private build(): void {
    const cam = this.scene.cameras.main;
    const W   = cam.width;
    const H   = cam.height;
    const cx  = W / 2;

    this.cx = cx;

    const allDefs       = AchievementManager.instance.getAll();
    const unlockedCount = allDefs.filter(d => d.unlocked).length;

    const GRID_W    = COLS * CELL_W + (COLS - 1) * CELL_GAP_X;
    const PW        = GRID_W + PAD * 2;
    const HEADER_H  = 110; // title + progress + tabs
    const FOOTER_H  = 56;
    const ROWS       = Math.ceil(ACHIEVEMENTS.length / COLS);
    const GRID_H    = ROWS * CELL_H + (ROWS - 1) * CELL_GAP_Y;
    const PH        = HEADER_H + GRID_H + PAD + FOOTER_H;

    // Cap panel height to screen height with some margin
    const MAX_PH  = H - 40;
    const finalPH = Math.min(PH, MAX_PH);
    const cy      = H / 2;
    const panelT  = cy - finalPH / 2;

    this.PW       = PW;
    this.gridTopY = panelT + HEADER_H;

    // Overlay
    this.track(this.scene.add.rectangle(cx, cy, W, H, 0x000000, 0.88)
      .setScrollFactor(0).setDepth(DEPTH));

    // Panel bg — sized to fit all content
    this.panelBg = this.scene.add.rectangle(cx, cy, PW, finalPH, 0x001a2e)
      .setScrollFactor(0).setDepth(DEPTH + 1);
    this.track(this.panelBg);

    this.panelBdr = this.scene.add.rectangle(cx, cy, PW, finalPH)
      .setStrokeStyle(2, 0xffcc44).setFillStyle(0, 0)
      .setScrollFactor(0).setDepth(DEPTH + 2);
    this.track(this.panelBdr);

    // Title
    this.track(this.scene.add.text(cx, panelT + 22, "🏅  Badge Gallery", {
      fontSize: "18px", fontStyle: "bold", color: "#ffdd88",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 3));

    // Progress bar
    const barW  = PW - PAD * 2;
    const barY  = panelT + 52;
    const ratio = unlockedCount / ACHIEVEMENTS.length;
    this.track(this.scene.add.rectangle(cx, barY, barW, 6, 0x0a1e30)
      .setScrollFactor(0).setDepth(DEPTH + 3));
    this.track(this.scene.add.rectangle(
      cx - barW / 2 + (barW * ratio) / 2, barY,
      Math.max(barW * ratio, 1), 6, 0x44ff88
    ).setScrollFactor(0).setDepth(DEPTH + 3));
    this.track(this.scene.add.text(cx, barY + 10,
      `${unlockedCount} / ${ACHIEVEMENTS.length} unlocked`, {
      fontSize: "11px", color: "#88bbcc", fontFamily: "monospace",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 3));

    // Tabs
    const categories = ["all", ...new Set(ACHIEVEMENTS.map(a => a.category))];
    this.buildTabs(categories, panelT + 80, allDefs);

    // Grid
    this.buildGrid(allDefs);

    // Close button — always at panel bottom
    this.closeBtnY = panelT + finalPH - FOOTER_H / 2;
    this.closeBtn = this.scene.add.text(cx, this.closeBtnY, "✕  Close", {
      fontSize: "14px", color: "#ffcc44", fontFamily: "monospace",
      fontStyle: "bold", stroke: "#000", strokeThickness: 2,
      backgroundColor: "#0a2a3a", padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 5)
      .setInteractive({ useHandCursor: true });
    this.closeBtn.on("pointerover", () => this.closeBtn.setAlpha(0.75));
    this.closeBtn.on("pointerout",  () => this.closeBtn.setAlpha(1));
    this.closeBtn.on("pointerdown", () => this.dismiss());
    this.track(this.closeBtn);

    // Fade in
    this.allObjects.forEach(o => (o as any).setAlpha?.(0));
    this.scene.tweens.add({
      targets: this.allObjects, alpha: 1, duration: 250, ease: "Cubic.easeOut",
    });
  }

  private buildTabs(
    categories: string[],
    tabY: number,
    allDefs: (AchievementDefinition & { unlocked: boolean })[]
  ): void {
    this.tabObjects.forEach(o => o.destroy());
    this.tabObjects = [];

    const TAB_W  = (this.PW - 32) / categories.length;
    const startX = this.cx - (this.PW - 32) / 2;

    categories.forEach((cat, i) => {
      const tx       = startX + TAB_W * i + TAB_W / 2;
      const label    = cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1);
      const isActive = cat === this.activeCategory;

      const tab = this.scene.add.text(tx, tabY, label, {
        fontSize: "10px",
        color: isActive ? "#ffcc44" : "#556677",
        fontFamily: "monospace",
        fontStyle: isActive ? "bold" : "normal",
        backgroundColor: isActive ? "#0a2a3a" : undefined,
        padding: { x: 6, y: 3 },
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 4)
        .setInteractive({ useHandCursor: true });

      tab.on("pointerdown", () => {
        this.activeCategory = cat;
        this.buildTabs(categories, tabY, allDefs);
        this.buildGrid(allDefs);
      });
      tab.on("pointerover", () => { if (cat !== this.activeCategory) tab.setColor("#aabbcc"); });
      tab.on("pointerout",  () => { if (cat !== this.activeCategory) tab.setColor("#556677"); });

      this.tabObjects.push(tab);
      this.allObjects.push(tab);
    });
  }

  private buildGrid(allDefs: (AchievementDefinition & { unlocked: boolean })[]): void {
    // Remove old cells cleanly
    const oldSet = new Set(this.cellObjects);
    this.cellObjects.forEach(o => o.destroy());
    this.allObjects = this.allObjects.filter(o => !oldSet.has(o));
    this.cellObjects = [];

    const GRID_W = COLS * CELL_W + (COLS - 1) * CELL_GAP_X;
    const startX = this.cx - GRID_W / 2 + CELL_W / 2;

    const sorted = [...allDefs].sort((a, b) => {
      const aMatch = this.activeCategory === "all" || a.category === this.activeCategory;
      const bMatch = this.activeCategory === "all" || b.category === this.activeCategory;
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      if (aMatch && bMatch) {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
      }
      return 0;
    });

    sorted.forEach((def, i) => {
      const col      = i % COLS;
      const row      = Math.floor(i / COLS);
      const x        = startX + col * (CELL_W + CELL_GAP_X);
      const y        = this.gridTopY + row * (CELL_H + CELL_GAP_Y) + CELL_H / 2 + 6;
      const isMatch  = this.activeCategory === "all" || def.category === this.activeCategory;
      const catColor = CATEGORY_COLORS[def.category] ?? 0xffffff;

      const bgColor   = def.unlocked ? (isMatch ? 0x0a2a3a : 0x071520) : 0x0d1f2d;
      const bdrColor  = def.unlocked ? (isMatch ? catColor : 0x1a3344) : 0x1e3347;
      const bdrW      = def.unlocked && isMatch ? 2 : 1;
      const iconAlpha = def.unlocked ? (isMatch ? 1 : 0.3) : 0.2;
      const nameColor = def.unlocked ? (isMatch ? "#ffdd88" : "#1e3a4a") : "#1e3347";

      const bg = this.scene.add.rectangle(x, y, CELL_W, CELL_H, bgColor)
        .setScrollFactor(0).setDepth(DEPTH + 3);
      const bdr = this.scene.add.rectangle(x, y, CELL_W, CELL_H)
        .setStrokeStyle(bdrW, bdrColor).setFillStyle(0, 0)
        .setScrollFactor(0).setDepth(DEPTH + 3);
      const icon = this.scene.add.text(x, y - 18,
        def.unlocked ? def.icon : "🔒",
        { fontSize: def.unlocked ? "24px" : "18px" }
      ).setOrigin(0.5).setAlpha(iconAlpha).setScrollFactor(0).setDepth(DEPTH + 4);
      const name = this.scene.add.text(x, y + 14, def.name, {
        fontSize: "8px", color: nameColor,
        fontFamily: "monospace", fontStyle: "bold",
        wordWrap: { width: CELL_W - 8 }, align: "center",
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 4);
      const pip = this.scene.add.rectangle(x, y + CELL_H / 2 - 5, CELL_W - 16, 3,
        def.unlocked && isMatch ? catColor : 0x1e3347
      ).setAlpha(def.unlocked && isMatch ? 0.6 : 0.15)
        .setScrollFactor(0).setDepth(DEPTH + 4);

      [bg, bdr, icon, name, pip].forEach(o => {
        this.cellObjects.push(o);
        this.allObjects.push(o);
      });
    });
  }

  private dismiss(): void {
    this.scene.tweens.add({
      targets: this.allObjects, alpha: 0, duration: 180, ease: "Cubic.easeIn",
      onComplete: () => {
        this.allObjects.forEach(o => o.destroy());
        this.allObjects  = [];
        this.cellObjects = [];
        this.tabObjects  = [];
        this.onClose?.();
      },
    });
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.allObjects.push(obj);
    return obj;
  }
}