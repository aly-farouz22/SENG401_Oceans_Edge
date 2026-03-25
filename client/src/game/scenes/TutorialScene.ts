import Phaser from "phaser";

interface Slide {
  title: string;
  badge: string;
  accent: number;
  accentS: string;
  lines: { text: string; color: string }[];
  showKeys?: boolean;
}

const SLIDES: Slide[] = [
  {
    title: "CONTROLS",
    badge: "CTRL",
    accent: 0x00ffaa,
    accentS: "#00ffaa",
    showKeys: true,
    lines: [
      { text: "Navigate your boat around the ocean:", color: "#aaccbb" },
      { text: "", color: "" },
      { text: "  ARROW KEYS  =  Steer your boat", color: "#ffffff" },
      { text: "  SPACE BAR   =  Fish / clean / interact", color: "#ffffff" },
      { text: "  ESC         =  Pause the game", color: "#ffffff" },
      { text: "", color: "" },
      { text: "TIP: Click anywhere on the ocean to", color: "#336655" },
      { text: "     set a destination (auto sail).", color: "#336655" },
    ],
  },
  {
    title: "FISHING ZONES",
    badge: "FISH",
    accent: 0x44ccff,
    accentS: "#44ccff",
    lines: [
      { text: "Blue glowing areas = fishing zones.", color: "#aaccbb" },
      { text: "Sail in, press SPACE to cast your net.", color: "#aaccbb" },
      { text: "", color: "" },
      { text: "COMMON fish    catch freely for income", color: "#aaffaa" },
      { text: "INVASIVE fish  unlimited = remove them!", color: "#ffcc44" },
      { text: "ENDANGERED     fine if you dock with them", color: "#ff6644" },
      { text: "", color: "" },
      { text: "Overfishing depletes zones. Let them recover.", color: "#336655" },
      { text: "Catch more than 10 common and they become endangered.", color: "#ff8844" },
    ],
  },
  {
    title: "THE MARKET DOCK",
    badge: "DOCK",
    accent: 0xffcc44,
    accentS: "#ffcc44",
    lines: [
      { text: "Top right corner = Market Dock.", color: "#aaccbb" },
      { text: "Dock here after each trip.", color: "#aaccbb" },
      { text: "", color: "" },
      { text: "AT THE DOCK:", color: "#ffcc44" },
      { text: "  Sell fish for money", color: "#ffffff" },
      { text: "  Pay boat maintenance fee per trip", color: "#ffffff" },
      { text: "  Buy upgrades such as fuel tank and net size", color: "#ffffff" },
      { text: "  Refuel your boat", color: "#ffffff" },
      { text: "", color: "" },
      { text: "Endangered fish caught = FINE on arrival.", color: "#ff6644" },
      { text: "Release them at sea to avoid the fine.", color: "#aaccbb" },
    ],
  },
  {
    title: "FUEL AND CAPACITY",
    badge: "FUEL",
    accent: 0xff8844,
    accentS: "#ff8844",
    lines: [
      { text: "FUEL BAR at top left drains while moving.", color: "#aaccbb" },
      { text: "A timer shows how long your fuel lasts.", color: "#aaccbb" },
      { text: "", color: "" },
      { text: "If fuel hits zero at sea, your boat sinks.", color: "#ff4455" },
      { text: "You lose all fish. Game ends. Start from Level 1.", color: "#ff6644" },
      { text: "", color: "" },
      { text: "FISH CAPACITY = max fish you can carry.", color: "#aaccbb" },
      { text: "Reach dock before the hold is full.", color: "#aaccbb" },
      { text: "", color: "" },
      { text: "Level up to unlock bigger tanks and larger nets.", color: "#ffcc44" },
    ],
  },
  {
    title: "SEASONS AND LEVELS",
    badge: "LEVL",
    accent: 0xcc88ff,
    accentS: "#cc88ff",
    lines: [
      { text: "Game runs in seasons. At season end:", color: "#aaccbb" },
      { text: "  Fuel, maintenance, and licence fees are deducted", color: "#ffffff" },
      { text: "  Cannot cover costs = BANKRUPTCY = Game Over", color: "#ff4455" },
      { text: "", color: "" },
      { text: "LEVEL UP REQUIREMENTS:", color: "#cc88ff" },
      { text: "  Level 1 to 2: 30 common + 1 legendary fish", color: "#ffffff" },
      { text: "  Level 2 to 3: 30 common + 2 legendary fish", color: "#ffffff" },
      { text: "  Level 3 to 4: 40 common + 1 legendary + 2 unique fish", color: "#ffffff" },
      { text: "", color: "" },
      { text: "New levels unlock species and upgrades.", color: "#cc88ff" },
    ],
  },
  {
    title: "OCEAN HEALTH",
    badge: "ECO",
    accent: 0x44ff88,
    accentS: "#44ff88",
    lines: [
      { text: "CORAL HEALTH tracks ecosystem status.", color: "#44ff88" },
      { text: "Keep it above 0% to keep playing.", color: "#aaccbb" },
      { text: "", color: "" },
      { text: "Coral drops when you:", color: "#aaccbb" },
      { text: "  Catch too many endangered species", color: "#ff6644" },
      { text: "  Leave trash zones uncleaned", color: "#ff6644" },
      { text: "", color: "" },
      { text: "Coral hits 0% = ECOSYSTEM COLLAPSE = Game Over", color: "#ff4455" },
      { text: "", color: "" },
      { text: "UN SDG 14: Protect life below water.", color: "#336655" },
      { text: "The future of the ocean is in your hands.", color: "#224433" },
    ],
  },
];

export default class TutorialScene extends Phaser.Scene {
  private current = 0;
  private slideGroup!: Phaser.GameObjects.Group;
  private dots: Phaser.GameObjects.Rectangle[] = [];
  private nextBtn!: Phaser.GameObjects.Text;
  private pageText!: Phaser.GameObjects.Text;
  private skipBtn!: Phaser.GameObjects.Text;
  private W = 0;
  private H = 0;
  private cx = 0;
  private cy = 0;

  constructor() {
    super("TutorialScene");
  }

  create() {
    this.W = this.cameras.main.width;
    this.H = this.cameras.main.height;
    this.cx = this.W / 2;
    this.cy = this.H / 2;

    this.add.image(this.cx, this.cy, "boot_bg").setDisplaySize(this.W, this.H).setDepth(0);
    this.add.rectangle(this.cx, this.cy, this.W, this.H, 0x050a00, 0.9).setDepth(1);

    for (let y = 0; y < this.H; y += 4) {
      this.add.rectangle(this.cx, y, this.W, 1, 0x000000, 0.08).setDepth(2);
    }

    this.add.rectangle(this.cx, 22, this.W, 44, 0x050a00, 1).setDepth(3);
    this.add.rectangle(this.cx, 44, this.W, 2, 0x44ff88, 1).setDepth(3);

    this.add.text(this.cx, 22, "[ HOW TO PLAY ]", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#44ff88",
      fontFamily: "monospace",
    }).setOrigin(0.5, 0.5).setDepth(4);

    this.buildSkipButton();

    this.slideGroup = this.add.group();
    this.buildSlide(0, false);
    this.buildDots();
    this.buildNav();

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private buildSkipButton() {
    this.skipBtn = this.add.text(this.W - 24, 22, "[ SKIP ]", {
      fontSize: "14px",
      fontStyle: "bold",
      color: "#ffcc44",
      fontFamily: "monospace",
      backgroundColor: "#1a1200",
      padding: { x: 10, y: 6 },
    }).setOrigin(1, 0.5).setDepth(5).setInteractive({ useHandCursor: true });

    this.skipBtn.on("pointerover", () => this.skipBtn.setColor("#ffffff"));
    this.skipBtn.on("pointerout", () => this.skipBtn.setColor("#ffcc44"));
    this.skipBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("MainScene");
      });
    });
  }

  private buildSlide(index: number, animate = true) {
    this.slideGroup.clear(true, true);

    const slide = SLIDES[index];
    const pw = this.W - 80;
    const ph = this.H - 160;
    const px = this.cx;
    const py = 66 + ph / 2;

    const panel = this.add.rectangle(px, py, pw, ph, 0x030800, 0.95).setDepth(3);
    const border = this.add.rectangle(px, py, pw, ph).setStrokeStyle(2, slide.accent).setDepth(3);

    const corners = [
      [px - pw / 2, py - ph / 2],
      [px + pw / 2, py - ph / 2],
      [px - pw / 2, py + ph / 2],
      [px + pw / 2, py + ph / 2],
    ].map(([x, y]) => this.add.rectangle(x, y, 8, 8, slide.accent).setDepth(4));

    const badgeBg = this.add.rectangle(px - pw / 2 + 48, py - ph / 2 + 26, 64, 28, slide.accent).setDepth(4);
    const badgeTxt = this.add.text(px - pw / 2 + 48, py - ph / 2 + 26, slide.badge, {
      fontSize: "12px",
      fontStyle: "bold",
      color: "#000000",
      fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(5);

    const titleTxt = this.add.text(px - pw / 2 + 98, py - ph / 2 + 26, slide.title, {
      fontSize: "18px",
      fontStyle: "bold",
      color: slide.accentS,
      fontFamily: "monospace",
    }).setOrigin(0, 0.5).setDepth(4);

    const divs: Phaser.GameObjects.Rectangle[] = [];
    for (let x = px - pw / 2 + 16; x < px + pw / 2 - 16; x += 8) {
      divs.push(this.add.rectangle(x, py - ph / 2 + 50, 4, 1, slide.accent, 0.35).setDepth(4));
    }

    const lines: Phaser.GameObjects.Text[] = [];
    const startY = py - ph / 2 + 68;

    slide.lines.forEach((line, i) => {
      if (!line.text) return;
      lines.push(
        this.add.text(px - pw / 2 + 24, startY + i * 19, line.text, {
          fontSize: "13px",
          color: line.color,
          fontFamily: "monospace",
        }).setDepth(4)
      );
    });

    const keyObjs: Phaser.GameObjects.Text[] = [];
    if (slide.showKeys) {
      const kx = px;
      const ky = py + 35;
      const keyLines = ["     [▲]    ", "  [◀][▼][▶] ", "", "  [ SPACE ] ", "  INTERACT  "];

      keyLines.forEach((kl, i) => {
        keyObjs.push(
          this.add.text(kx, ky + i * 18, kl, {
            fontSize: "13px",
            color: i < 2 ? slide.accentS : "#224422",
            fontFamily: "monospace",
            align: "center",
          }).setOrigin(0.5).setDepth(4)
        );
      });
    }

    const all = [panel, border, ...corners, badgeBg, badgeTxt, titleTxt, ...divs, ...lines, ...keyObjs];
    this.slideGroup.addMultiple(all);

    if (animate) {
      all.forEach((obj, i) => {
        const go = obj as Phaser.GameObjects.GameObject & { setAlpha?: (value: number) => void };
        if (go.setAlpha) go.setAlpha(0);

        this.tweens.add({
          targets: obj,
          alpha: 1,
          duration: 200,
          delay: Math.min(i * 15, 180),
        });
      });
    }

    this.refreshDots(index);
    this.updateNav();
  }

  private buildDots() {
    const sp = 20;
    const sy = this.H - 48;
    const sx = this.cx - ((SLIDES.length - 1) * sp) / 2;

    SLIDES.forEach((_, i) => {
      this.dots.push(
        this.add.rectangle(sx + i * sp, sy, 8, 8, 0x112200).setDepth(5)
      );
    });

    this.refreshDots(0);
  }

  private refreshDots(active: number) {
    this.dots.forEach((d, i) => {
      d.setFillStyle(i === active ? SLIDES[active].accent : 0x112200);
      d.setSize(i === active ? 12 : 8, i === active ? 12 : 8);
    });
  }

  private buildNav() {
    const ny = this.H - 24;

    const prev = this.add.text(this.cx - 140, ny, "[ < PREV ]", {
      fontSize: "14px",
      fontStyle: "bold",
      color: "#335533",
      fontFamily: "monospace",
      stroke: "#000",
      strokeThickness: 2,
      backgroundColor: "#030800",
      padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });

    prev.on("pointerover", () => prev.setColor("#44ff88"));
    prev.on("pointerout", () => prev.setColor("#335533"));
    prev.on("pointerdown", () => {
      if (this.current > 0) {
        this.current--;
        this.buildSlide(this.current);
      }
    });

    this.pageText = this.add.text(this.cx, ny, `1 / ${SLIDES.length}`, {
      fontSize: "12px",
      color: "#224422",
      fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(5);

    this.nextBtn = this.add.text(this.cx + 140, ny, "[ NEXT > ]", {
      fontSize: "14px",
      fontStyle: "bold",
      color: "#44ff88",
      fontFamily: "monospace",
      stroke: "#001100",
      strokeThickness: 2,
      backgroundColor: "#0a1a00",
      padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });

    this.nextBtn.on("pointerover", () => this.nextBtn.setColor("#ffffff"));
    this.nextBtn.on("pointerout", () => {
      this.nextBtn.setColor(this.current === SLIDES.length - 1 ? "#ffcc44" : "#44ff88");
    });

    this.nextBtn.on("pointerdown", () => {
      if (this.current < SLIDES.length - 1) {
        this.current++;
        this.buildSlide(this.current);
      } else {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("MainScene");
        });
      }
    });
  }

  private updateNav() {
    const last = this.current === SLIDES.length - 1;
    this.nextBtn?.setText(last ? "[ PLAY NOW ]" : "[ NEXT > ]");
    this.nextBtn?.setColor(last ? "#ffcc44" : "#44ff88");
    this.pageText?.setText(`${this.current + 1} / ${SLIDES.length}`);
  }
}