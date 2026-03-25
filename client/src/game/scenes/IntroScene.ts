import Phaser from "phaser";

const SLIDES = [
  {
    title:  "THE OCEAN IS IN CRISIS",
    accent: 0x44ccff, accentS: "#44ccff",
    body: [
      "Our oceans cover 71% of the Earth's surface.",
      "They produce 50% of the oxygen we breathe.",
      "Over 3 billion people depend on them for food",
      "and livelihoods.",
      "",
      "But overfishing, plastic pollution, and climate",
      "change are pushing marine ecosystems to the edge.",
      "",
      "The United Nations has made ocean conservation",
      "one of its 17 Sustainable Development Goals.",
      "",
      "SDG 14: Life Below Water.",
    ],
  },
  {
    title:  "YOUR MISSION",
    accent: 0x00ffaa, accentS: "#00ffaa",
    body: [
      "You are the captain of Ocean's Edge —",
      "a small fishing village that depends on the sea.",
      "",
      "Your goal: keep the village alive for as many",
      "seasons as possible, without destroying",
      "the very ocean you rely on.",
      "",
      "Every trip, every catch, every decision",
      "shapes the future of the ecosystem.",
      "",
      "Fish too much — the ocean dies.",
      "Fish too little — your village starves.",
      "",
      "Balance is everything.",
    ],
  },
  {
    title:  "HOW TO WIN & LOSE",
    accent: 0xffcc44, accentS: "#ffcc44",
    body: [
      "SURVIVE by covering your seasonal costs:",
      "  Fuel + Boat Maintenance + Licence Fee",
      "  Fail to break even = BANKRUPTCY = Game Over",
      "",
      "LEVEL UP by catching quota fish:",
      "  Reach catch milestones to unlock bigger boats,",
      "  more fuel, and new species of fish.",
      "",
      "GAME OVER conditions:",
      "  Boat sinks (fuel runs out at sea)",
      "  Bankrupt (can't cover seasonal costs)",
      "  Coral health = 0% (ecosystem collapsed)",
      "  3 endangered species go extinct (lose upgrades)",
    ],
  },
  {
    title:  "THE WORLD IS WATCHING",
    accent: 0xcc88ff, accentS: "#cc88ff",
    body: [
      "Ocean's Edge is inspired by the real-world",
      "challenge of sustainable fisheries management.",
      "",
      "The UN estimates that if current overfishing",
      "trends continue, we will have virtually",
      "emptied the oceans by 2048.",
      "",
      "By playing this game, you experience the",
      "impossible trade-offs that fishing communities",
      "and governments face every day.",
      "",
      "Learn. Decide. Protect.",
      "",
      "The ocean needs you, Captain.",
    ],
  },
];

export default class IntroScene extends Phaser.Scene {
  private current      = 0;
  private slideGroup!: Phaser.GameObjects.Group;
  private dots:        Phaser.GameObjects.Rectangle[] = [];
  private nextBtn!:    Phaser.GameObjects.Text;
  private pageText!:   Phaser.GameObjects.Text;
  private W = 0; private H = 0; private cx = 0; private cy = 0;

  constructor() { super("IntroScene"); }

  create() {
    this.W = this.cameras.main.width;
    this.H = this.cameras.main.height;
    this.cx = this.W / 2; this.cy = this.H / 2;

    // Background — deep navy tint
    this.add.image(this.cx, this.cy, "boot_bg").setDisplaySize(this.W, this.H).setDepth(0);
    this.add.rectangle(this.cx, this.cy, this.W, this.H, 0x00080f, 0.90).setDepth(1);
    for (let y = 0; y < this.H; y += 4) {
      this.add.rectangle(this.cx, y, this.W, 1, 0x000000, 0.08).setDepth(2);
    }

    // Header
    this.add.rectangle(this.cx, 22, this.W, 44, 0x00080f, 1).setDepth(3);
    this.add.rectangle(this.cx, 44, this.W, 2, 0x44ccff, 1).setDepth(3);
    this.add.text(this.cx, 22, "[ STORY ]", {
      fontSize: "16px", fontStyle: "bold", color: "#44ccff", fontFamily: "monospace",
    }).setOrigin(0.5, 0.5).setDepth(4);

    this.slideGroup = this.add.group();
    this.buildSlide(0, false);
    this.buildDots();
    this.buildNav();
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private buildSlide(index: number, animate = true) {
    this.slideGroup.clear(true, true);
    const slide = SLIDES[index];
    const pw = this.W - 80, ph = this.H - 160;
    const px = this.cx, py = 66 + ph / 2;

    const panel  = this.add.rectangle(px, py, pw, ph, 0x00080f, 0.95).setDepth(3);
    const border = this.add.rectangle(px, py, pw, ph).setStrokeStyle(2, slide.accent).setDepth(3);
    const corners = [
      [px - pw/2, py - ph/2], [px + pw/2, py - ph/2],
      [px - pw/2, py + ph/2], [px + pw/2, py + ph/2],
    ].map(([x, y]) => this.add.rectangle(x, y, 8, 8, slide.accent).setDepth(4));

    // Title
    const titleTxt = this.add.text(px, py - ph/2 + 28, slide.title, {
      fontSize: "18px", fontStyle: "bold", color: slide.accentS, fontFamily: "monospace",
    }).setOrigin(0.5, 0.5).setDepth(4);

    // Divider
    const divs: Phaser.GameObjects.Rectangle[] = [];
    for (let x = px - pw/2 + 16; x < px + pw/2 - 16; x += 8) {
      divs.push(this.add.rectangle(x, py - ph/2 + 50, 4, 1, slide.accent, 0.35).setDepth(4));
    }

    // UN SDG badge (slide 0)
    let badgeObjs: Phaser.GameObjects.GameObject[] = [];
    if (index === 0) {
      const bx = px + pw/2 - 88, by2 = py - ph/2 + 28;
      const bbg = this.add.rectangle(bx, by2, 130, 32, 0x004488).setDepth(4);
      this.add.rectangle(bx, by2, 130, 32).setStrokeStyle(1, 0x0088cc).setDepth(4);
      const btxt = this.add.text(bx, by2 - 6, "UN SDG 14", {
        fontSize: "11px", fontStyle: "bold", color: "#88ccff", fontFamily: "monospace",
      }).setOrigin(0.5).setDepth(5);
      const btxt2 = this.add.text(bx, by2 + 8, "LIFE BELOW WATER", {
        fontSize: "9px", color: "#44ccff", fontFamily: "monospace",
      }).setOrigin(0.5).setDepth(5);
      badgeObjs = [bbg, btxt, btxt2];
    }

    // Body text
    const bodyObjs: Phaser.GameObjects.Text[] = [];
    const startY = py - ph/2 + 66;
    slide.body.forEach((line, i) => {
      if (!line) return;
      const isHighlight = line.startsWith("Balance") || line.startsWith("SDG 14") ||
                          line.startsWith("Learn") || line.startsWith("The ocean needs");
      bodyObjs.push(this.add.text(px - pw/2 + 28, startY + i * 18, line, {
        fontSize: "13px",
        color: isHighlight ? slide.accentS : "#99bbaa",
        fontFamily: "monospace",
      }).setDepth(4));
    });

    const all = [panel, border, ...corners, titleTxt, ...divs, ...badgeObjs, ...bodyObjs];
    this.slideGroup.addMultiple(all);

    if (animate) {
      all.forEach((obj, i) => {
        const go = obj as Phaser.GameObjects.GameObject & { setAlpha?: Function };
        go.setAlpha?.(0);
        this.tweens.add({ targets: obj, alpha: 1, duration: 220, delay: Math.min(i * 15, 200) });
      });
    }

    this.refreshDots(index);
    this.updateNav();
  }

  private buildDots() {
    const sp = 20, dy = this.H - 48;
    const sx = this.cx - ((SLIDES.length - 1) * sp) / 2;
    SLIDES.forEach((_, i) => {
      this.dots.push(this.add.rectangle(sx + i * sp, dy, 8, 8, 0x112233).setDepth(5));
    });
    this.refreshDots(0);
  }

  private refreshDots(active: number) {
    this.dots.forEach((d, i) => {
      d.setFillStyle(i === active ? SLIDES[active].accent : 0x112233);
      d.setSize(i === active ? 12 : 8, i === active ? 12 : 8);
    });
  }

  private buildNav() {
    const ny = this.H - 24;

    const prev = this.add.text(this.cx - 140, ny, "[ < PREV ]", {
      fontSize: "14px", fontStyle: "bold", color: "#225577",
      fontFamily: "monospace", stroke: "#000", strokeThickness: 2,
      backgroundColor: "#000d1a", padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    prev.on("pointerover", () => prev.setColor("#44ccff"));
    prev.on("pointerout",  () => prev.setColor("#225577"));
    prev.on("pointerdown", () => {
      if (this.current > 0) { this.current--; this.buildSlide(this.current); }
    });

    this.pageText = this.add.text(this.cx, ny, `1 / ${SLIDES.length}`, {
      fontSize: "12px", color: "#224455", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(5);

    this.nextBtn = this.add.text(this.cx + 140, ny, "[ NEXT > ]", {
      fontSize: "14px", fontStyle: "bold", color: "#44ccff",
      fontFamily: "monospace", stroke: "#001122", strokeThickness: 2,
      backgroundColor: "#001122", padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    this.nextBtn.on("pointerover", () => this.nextBtn.setColor("#ffffff"));
    this.nextBtn.on("pointerout",  () => this.nextBtn.setColor(
      this.current === SLIDES.length - 1 ? "#ffcc44" : "#44ccff"
    ));
    this.nextBtn.on("pointerdown", () => {
      if (this.current < SLIDES.length - 1) {
        this.current++;
        this.buildSlide(this.current);
      } else {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("TutorialScene"));
      }
    });
  }

  private updateNav() {
    const last = this.current === SLIDES.length - 1;
    this.nextBtn?.setText(last ? "[ TUTORIAL > ]" : "[ NEXT > ]");
    this.nextBtn?.setColor(last ? "#ffcc44" : "#44ccff");
    this.pageText?.setText(`${this.current + 1} / ${SLIDES.length}`);
  }
}