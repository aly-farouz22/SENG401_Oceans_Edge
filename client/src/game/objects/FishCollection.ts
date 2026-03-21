import Phaser from "phaser";

const DEPTH = 180;

export interface FishEntry {
  id:          string;
  name:        string;
  rarity:      "common" | "uncommon" | "rare" | "legendary";
  points:      number;
  endangered:  boolean;
  invasive:    boolean;
  description: string;
  spriteKey:   string;
}

export const FISH_REGISTRY: FishEntry[] = [
  { id:"anchovy_sprat",   name:"Anchovy Sprat",   rarity:"common",    points:15,  endangered:false, invasive:false, spriteKey:"fish_anchovy",   description:"A small schooling fish vital to the food chain. Common in shallow reefs." },
  { id:"haddock",         name:"Haddock",          rarity:"common",    points:15,  endangered:false, invasive:false, spriteKey:"fish_haddock",   description:"A bottom-dwelling fish popular in coastal fisheries. Sustainable when managed well." },
  { id:"opah",            name:"Opah",             rarity:"uncommon",  points:25,  endangered:false, invasive:false, spriteKey:"fish_opah",      description:"A large warm-blooded fish from open waters. Rarely seen near the surface." },
  { id:"red_snapper",     name:"Red Snapper",      rarity:"uncommon",  points:30,  endangered:false, invasive:false, spriteKey:"fish_snapper",   description:"Prized for its firm flesh. Found around coral reefs and rocky bottoms." },
  { id:"pacific_halibut", name:"Pacific Halibut",  rarity:"rare",      points:75,  endangered:false, invasive:false, spriteKey:"fish_halibut",   description:"One of the largest flatfish. A prized catch that can live over 50 years." },
  { id:"swordfish",       name:"Swordfish",        rarity:"rare",      points:100, endangered:false, invasive:false, spriteKey:"fish_swordfish", description:"A powerful migratory predator known for its long flat bill and incredible speed." },
  { id:"aurora_trout",    name:"Aurora Trout",     rarity:"legendary", points:300, endangered:true,  invasive:false, spriteKey:"fish_aurora",    description:"Critically endangered. Once abundant in northern lakes, now extremely rare." },
  { id:"bluefin_tuna",    name:"Bluefin Tuna",     rarity:"legendary", points:500, endangered:true,  invasive:false, spriteKey:"fish_bluefin",   description:"An apex ocean predator. Severely overfished — catching one harms the ecosystem." },
  { id:"lionfish",        name:"Lionfish",         rarity:"uncommon",  points:20,  endangered:false, invasive:true,  spriteKey:"fish_lionfish",  description:"An invasive species devastating Atlantic reefs. Catching them is encouraged." },
  { id:"green_crab",      name:"Green Crab",       rarity:"common",    points:8,   endangered:false, invasive:true,  spriteKey:"fish_crab",      description:"A highly invasive crab spreading along coastlines. Removal helps native species." },
];

const RARITY_COLORS: Record<string, number> = {
  common:    0x88bbcc,
  uncommon:  0x44ccff,
  rare:      0xffaa44,
  legendary: 0xff44aa,
};

type TabFilter = "all" | "endangered" | "caught";

export default class FishCollection {
  private scene:         Phaser.Scene;
  private objects:       Phaser.GameObjects.GameObject[] = [];
  private cellObjects:   Phaser.GameObjects.GameObject[] = [];
  private tabObjects:    Phaser.GameObjects.GameObject[] = [];
  private detailObjects: Phaser.GameObjects.GameObject[] = [];
  private caughtIds:     Set<string> = new Set();
  private activeTab:     TabFilter = "all";

  public onClose?: () => void;

  // Layout computed in constructor
  private BG_W = 0; private BG_H = 0;
  private BG_X = 0; private BG_Y = 0;
  private SPINE_X = 0; // world x of spine
  private PAGE_TOP = 0;
  private PAGE_BOT = 0;
  private L_START = 0; private L_END = 0;
  private R_START = 0; private R_END = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const cam   = scene.cameras.main;
    const scale = Math.min(cam.width * 0.88 / 300, cam.height * 0.88 / 200);
    this.BG_W   = 300 * scale;
    this.BG_H   = 200 * scale;
    this.BG_X   = cam.width  / 2;
    this.BG_Y   = cam.height / 2;

    const left = this.BG_X - this.BG_W / 2;
    const top  = this.BG_Y - this.BG_H / 2;

    // Spine at 48.7% from left
    this.SPINE_X = left + this.BG_W * 0.487;

    // Page content bounds (with margins)
    this.PAGE_TOP = top  + this.BG_H * 0.12;
    this.PAGE_BOT = top  + this.BG_H * 0.88;

    // Left page: from 5% to spine-2%
    this.L_START  = left + this.BG_W * 0.05;
    this.L_END    = this.SPINE_X - this.BG_W * 0.02;

    // Right page: from spine+2% to 90%
    this.R_START  = this.SPINE_X + this.BG_W * 0.02;
    this.R_END    = left + this.BG_W * 0.90;
  }

  show(caughtFishIds: string[]): void {
    this.caughtIds = new Set(caughtFishIds);
    this.activeTab = "all";
    this.build();
  }

  private build(): void {
    const cam = this.scene.cameras.main;

    // Dim overlay
    this.track(this.scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.72)
      .setScrollFactor(0).setDepth(DEPTH));

    // Book background
    this.track(this.scene.add.image(this.BG_X, this.BG_Y, "collection_bg")
      .setDisplaySize(this.BG_W, this.BG_H)
      .setScrollFactor(0).setDepth(DEPTH + 1));

    this.buildTabs();
    this.buildGrid();
  }

  // ── Invisible hit zones aligned to bookmark graphics ─────────────────────────
  // Bookmark Y centres in sprite % (from pixel analysis):
  //   Blue   y≈29%,  Orange y≈43%,  Green y≈57%,  Red y≈70%
  // They protrude from right edge: x≈87%-100% of sprite width

  private buildTabs(): void {
    this.tabObjects.forEach(o => o.destroy());
    this.tabObjects = [];

    const top  = this.BG_Y - this.BG_H / 2;
    const left = this.BG_X - this.BG_W / 2;

    const tabs: { filter: TabFilter | "exit"; yPct: number }[] = [
      { filter: "all",        yPct: 0.29 },
      { filter: "endangered", yPct: 0.43 },
      { filter: "caught",     yPct: 0.57 },
      { filter: "exit",       yPct: 0.70 },
    ];

    // Hit zone covers the bookmark area: x from 85% to 100% of sprite
    const zoneX  = left + this.BG_W * 0.925; // centre of hit zone
    const zoneW  = this.BG_W * 0.15;
    const zoneH  = this.BG_H * 0.10;

    tabs.forEach((tab) => {
      const ty = top + this.BG_H * tab.yPct;

      // Invisible interactive rectangle over the bookmark
      const zone = this.scene.add.rectangle(zoneX, ty, zoneW, zoneH, 0xffffff, 0)
        .setScrollFactor(0).setDepth(DEPTH + 5)
        .setInteractive({ useHandCursor: true });

      zone.on("pointerdown", () => {
        if (tab.filter === "exit") { this.dismiss(); return; }
        this.activeTab = tab.filter as TabFilter;
        this.rebuildGrid();
        this.buildTabs();
      });

      // Subtle pointer-hand feedback via alpha flicker on the book sprite (optional)
      this.tabObjects.push(zone);
      this.objects.push(zone);
    });
  }

  // ── Grid split across both pages ─────────────────────────────────────────────

  private buildGrid(): void {
    const filtered = this.getFiltered();
    const pageH    = this.PAGE_BOT - this.PAGE_TOP;
    const lPageW   = this.L_END - this.L_START;
    const rPageW   = this.R_END - this.R_START;

    const COLS   = 3;
    const cellW  = lPageW / COLS;          // both pages same width
    const cellH  = cellW * 0.90;
    const ROWS   = Math.floor(pageH / cellH);
    const perPage = COLS * ROWS;

    const leftItems  = filtered.slice(0, perPage);
    const rightItems = filtered.slice(perPage);

    this.renderPage(leftItems,  this.L_START, this.PAGE_TOP, cellW, cellH, COLS);
    this.renderPage(rightItems, this.R_START, this.PAGE_TOP, cellW, cellH, COLS);
  }

  private renderPage(
    entries: FishEntry[],
    pageStartX: number,
    pageStartY: number,
    cellW: number, cellH: number, cols: number
  ): void {
    entries.forEach((entry, i) => {
      const col    = i % cols;
      const row    = Math.floor(i / cols);
      const cx     = pageStartX + col * cellW + cellW / 2;
      const cy     = pageStartY + row * cellH + cellH / 2;
      const caught = this.caughtIds.has(entry.id);

      const bg = this.scene.add.rectangle(cx, cy, cellW - 3, cellH - 3,
        caught ? 0xf0ead8 : 0x111111, caught ? 0.65 : 0.88
      ).setScrollFactor(0).setDepth(DEPTH + 2)
        .setInteractive({ useHandCursor: caught });

      this.cellObjects.push(bg);
      this.objects.push(bg);

      if (caught) {
        const img = this.scene.add.image(cx, cy - cellH * 0.06, entry.spriteKey)
          .setDisplaySize(cellW - 10, cellH - 22)
          .setScrollFactor(0).setDepth(DEPTH + 3);

        const nameText = this.scene.add.text(cx, cy + cellH / 2 - 3, entry.name, {
          fontSize: `${Math.round(this.BG_H * 0.037)}px`,
          color: "#332200", fontFamily: "monospace", fontStyle: "bold",
          wordWrap: { width: cellW - 4 }, align: "center",
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(DEPTH + 3);

        const pip = this.scene.add.rectangle(cx, cy + cellH / 2 - 1, cellW * 0.55, 2,
          RARITY_COLORS[entry.rarity] ?? 0xaaaaaa
        ).setScrollFactor(0).setDepth(DEPTH + 3);

        this.cellObjects.push(img, nameText, pip);
        this.objects.push(img, nameText, pip);

        bg.on("pointerdown", () => this.showDetail(entry));
        bg.on("pointerover",  () => bg.setFillStyle(0xe0d8c0, 0.9));
        bg.on("pointerout",   () => bg.setFillStyle(0xf0ead8, 0.65));
      } else {
        const silhouette = this.scene.add.image(cx, cy - cellH * 0.06, entry.spriteKey)
          .setDisplaySize(cellW - 10, cellH - 22)
          .setTint(0x000000)
          .setAlpha(0.6)
          .setScrollFactor(0).setDepth(DEPTH + 3);
        this.cellObjects.push(silhouette);
        this.objects.push(silhouette);
      }
    });
  }

  private rebuildGrid(): void {
    const oldSet = new Set([...this.cellObjects, ...this.detailObjects]);
    [...this.cellObjects, ...this.detailObjects].forEach(o => o.destroy());
    this.objects       = this.objects.filter(o => !oldSet.has(o));
    this.cellObjects   = [];
    this.detailObjects = [];
    this.buildGrid();
  }

  // ── Detail panel on right page ────────────────────────────────────────────────

  private showDetail(entry: FishEntry): void {
    this.detailObjects.forEach(o => o.destroy());
    this.detailObjects = [];

    const rPageCX = (this.R_START + this.R_END) / 2;
    const rPageW  = this.R_END - this.R_START;
    let y         = this.PAGE_TOP + 4;
    const fs      = (pct: number) => `${Math.round(this.BG_H * pct)}px`;

    // Light wash behind detail
    const midY = (this.PAGE_TOP + this.PAGE_BOT) / 2;
    const dim  = this.scene.add.rectangle(rPageCX, midY, rPageW, this.PAGE_BOT - this.PAGE_TOP, 0xfff8e8, 0.9)
      .setScrollFactor(0).setDepth(DEPTH + 2);
    this.detailObjects.push(dim); this.objects.push(dim);

    // Fish image
    const imgH = this.BG_H * 0.27;
    const img  = this.scene.add.image(rPageCX, y + imgH / 2, entry.spriteKey)
      .setDisplaySize(rPageW * 0.65, imgH)
      .setScrollFactor(0).setDepth(DEPTH + 4);
    this.detailObjects.push(img); this.objects.push(img);
    y += imgH + 4;

    // Name
    const name = this.scene.add.text(rPageCX, y, entry.name, {
      fontSize: fs(0.065), fontStyle: "bold", color: "#221100",
      fontFamily: "monospace", wordWrap: { width: rPageW - 8 }, align: "center",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 4);
    this.detailObjects.push(name); this.objects.push(name);
    y += name.height + 2;

    // Rarity
    const rarHex  = `#${RARITY_COLORS[entry.rarity].toString(16).padStart(6, "0")}`;
    const rar = this.scene.add.text(rPageCX, y, entry.rarity.toUpperCase(), {
      fontSize: fs(0.05), color: rarHex,
      fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 4);
    this.detailObjects.push(rar); this.objects.push(rar);
    y += rar.height + 2;

    // Tags
    const tags: string[] = [];
    if (entry.endangered) tags.push("⚠ Endangered");
    if (entry.invasive)   tags.push("☠ Invasive");
    if (tags.length) {
      const t = this.scene.add.text(rPageCX, y, tags.join("  "), {
        fontSize: fs(0.044), color: "#aa3300", fontFamily: "monospace",
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 4);
      this.detailObjects.push(t); this.objects.push(t);
      y += t.height + 2;
    }

    // Points
    const pts = this.scene.add.text(rPageCX, y, `💰 ${entry.points} pts`, {
      fontSize: fs(0.055), color: "#886600",
      fontFamily: "monospace", fontStyle: "bold",
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 4);
    this.detailObjects.push(pts); this.objects.push(pts);
    y += pts.height + 4;

    // Description
    const desc = this.scene.add.text(rPageCX, y, entry.description, {
      fontSize: fs(0.043), color: "#443322",
      fontFamily: "monospace",
      wordWrap: { width: rPageW - 10 },
      align: "center", lineSpacing: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 4);
    this.detailObjects.push(desc); this.objects.push(desc);
  }

  // ── Filter ────────────────────────────────────────────────────────────────────

  private getFiltered(): FishEntry[] {
    switch (this.activeTab) {
      case "endangered": return FISH_REGISTRY.filter(f => f.endangered);
      case "caught":     return FISH_REGISTRY.filter(f => this.caughtIds.has(f.id));
      default:           return FISH_REGISTRY;
    }
  }

  // ── Dismiss ───────────────────────────────────────────────────────────────────

  private dismiss(): void {
    this.scene.tweens.add({
      targets: this.objects, alpha: 0, duration: 180, ease: "Cubic.easeIn",
      onComplete: () => {
        this.objects.forEach(o => o.destroy());
        this.objects = []; this.cellObjects = [];
        this.detailObjects = []; this.tabObjects = [];
        this.onClose?.();
      },
    });
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.objects.push(obj);
    return obj;
  }
}