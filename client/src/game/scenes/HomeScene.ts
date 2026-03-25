import Phaser from "phaser";
import { currentUsername } from "./BootScene";

// Scrolling ticker messages about SDG 14
const TICKER_MSGS = [
  "SDG 14: CONSERVE AND SUSTAINABLY USE THE OCEANS, SEAS AND MARINE RESOURCES",
  "BY 2050, PLASTIC POLLUTION COULD OUTWEIGH ALL FISH IN THE OCEAN",
  "OVER 3 BILLION PEOPLE DEPEND ON THE OCEAN FOR THEIR LIVELIHOODS",
  "34% OF FISH STOCKS ARE OVERFISHED — UP FROM 10% IN 1974",
  "CORAL REEFS SUPPORT 25% OF ALL MARINE SPECIES",
  "OCEAN'S EDGE RAISES AWARENESS FOR SUSTAINABLE FISHING PRACTICES",
];

export default class HomeScene extends Phaser.Scene {
  private tickerIndex  = 0;
  private tickerText!: Phaser.GameObjects.Text;
  private tickerX      = 0;

  constructor() { super("HomeScene"); }

  create() {
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;

    // ── Background ─────────────────────────────────────────────────────────
    this.add.image(cx, cy, "boot_bg").setDisplaySize(W, H).setDepth(0);
    this.add.rectangle(cx, cy, W, H, 0x000814, 0.85).setDepth(1);

    // ── CRT scanlines ─────────────────────────────────────────────────────
    for (let y = 0; y < H; y += 4) {
      this.add.rectangle(cx, y, W, 1, 0x000000, 0.08).setDepth(2);
    }

    // ── Top bar ───────────────────────────────────────────────────────────
    this.add.rectangle(cx, 22, W, 44, 0x001122, 1).setDepth(3);
    this.add.rectangle(cx, 44, W, 2, 0x00cc88, 1).setDepth(3);

    this.add.text(16, 22, "[ OCEAN'S EDGE ]", {
      fontSize: "16px", fontStyle: "bold",
      color: "#00ffaa", fontFamily: "monospace",
    }).setOrigin(0, 0.5).setDepth(4);

    // Player name top-right
    this.add.text(W - 16, 22, `CAPTAIN: ${currentUsername.toUpperCase()}`, {
      fontSize: "13px", color: "#44ccff", fontFamily: "monospace",
    }).setOrigin(1, 0.5).setDepth(4);

    // ── UN SDG 14 badge ───────────────────────────────────────────────────
    const badgeX = cx, badgeY = 115;
    this.add.rectangle(badgeX, badgeY, 320, 80, 0x005588, 1).setDepth(3);
    this.add.rectangle(badgeX, badgeY, 320, 80).setStrokeStyle(2, 0x0088cc).setDepth(3);
    this.add.text(badgeX, badgeY - 10, "UNITED NATIONS", {
      fontSize: "10px", color: "#88ccff", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(4);
    this.add.text(badgeX, badgeY + 8, "SUSTAINABLE DEVELOPMENT GOAL 14", {
      fontSize: "13px", fontStyle: "bold", color: "#ffffff", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(4);
    this.add.text(badgeX, badgeY + 26, "LIFE BELOW WATER", {
      fontSize: "11px", color: "#44ccff", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(4);

    // ── Wave pixel art decoration ─────────────────────────────────────────
    const waveY = 170;
    this.add.text(cx, waveY, "~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~", {
      fontSize: "14px", color: "#004466", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(3);

    // ── Mission panel ─────────────────────────────────────────────────────
    const panelW = W - 90, panelH = 195;
    const panelX = cx, panelY = cy - 10;
    this.add.rectangle(panelX, panelY, panelW, panelH, 0x001122, 0.9).setDepth(3);
    this.add.rectangle(panelX, panelY, panelW, panelH).setStrokeStyle(1, 0x006644).setDepth(3);

    // Panel title
    this.add.text(panelX, panelY - panelH / 2 + 20, ">> MISSION BRIEFING", {
      fontSize: "14px", fontStyle: "bold", color: "#00ffaa", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(4);

    // Pixel divider
    const pdivY = panelY - panelH / 2 + 36;
    for (let x = panelX - panelW / 2 + 16; x < panelX + panelW / 2 - 16; x += 8) {
      this.add.rectangle(x, pdivY, 4, 1, 0x003322).setDepth(3);
    }

    const missionLines = [
      "The world's oceans are in crisis. Overfishing, pollution, and",
      "climate change threaten the marine ecosystems that billions",
      "of people depend on for food and livelihoods.",
      "",
      "As captain of Ocean's Edge, YOU must balance profit with",
      "conservation. Every decision shapes the future of the sea.",
      "",
      "Can you fish sustainably — and keep your village alive?",
    ];

    missionLines.forEach((line, i) => {
      const color = line.startsWith("As captain") ? "#44ccff"
                  : line.startsWith("Can you")    ? "#ffcc44"
                  : "#aaccbb";
      this.add.text(
        panelX - panelW / 2 + 24,
        panelY - panelH / 2 + 54 + i * 17,
        line,
        { fontSize: "12px", color, fontFamily: "monospace" }
      ).setDepth(4);
    });

    // ── Bottom wave ───────────────────────────────────────────────────────
    const bwaveY = cy + panelH / 2 + 16;
    this.add.text(cx, bwaveY, "~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~", {
      fontSize: "14px", color: "#004466", fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(3);

    // ── Stats strip ───────────────────────────────────────────────────────
    const statsY = H - 130;
    const stats = [
      { label: "FISH SPECIES",   value: "10+"  },
      { label: "SEASONS",        value: "∞"    },
      { label: "LEVELS",         value: "4"    },
      { label: "SDG GOAL",       value: "#14"  },
    ];
    const statW = (W - 80) / stats.length;
    this.add.rectangle(cx, statsY, W - 80, 60, 0x001122, 0.8).setDepth(3);
    this.add.rectangle(cx, statsY, W - 80, 60).setStrokeStyle(1, 0x002244).setDepth(3);

    stats.forEach((s, i) => {
      const sx = 40 + statW * i + statW / 2;
      this.add.text(sx, statsY - 10, s.value, {
        fontSize: "20px", fontStyle: "bold", color: "#00ffaa", fontFamily: "monospace",
      }).setOrigin(0.5).setDepth(4);
      this.add.text(sx, statsY + 12, s.label, {
        fontSize: "10px", color: "#336655", fontFamily: "monospace",
      }).setOrigin(0.5).setDepth(4);
    });

    // ── Play + Tutorial buttons ───────────────────────────────────────────
    const btnY = H - 60;

    const playBtn = this.makePixelButton(cx + 15, btnY, "[ PLAY GAME ]", "#00ffaa", "#001a0d");
    playBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("MenuScene");
      });
    });

    // ── Scrolling ticker bar ──────────────────────────────────────────────
    const tickerBarY = H - 18;
    this.add.rectangle(cx, tickerBarY, W, 26, 0x000814, 1).setDepth(4);
    this.add.rectangle(cx, tickerBarY - 13, W, 1, 0x004444, 1).setDepth(4);

    // Label
    this.add.text(8, tickerBarY, "SDG14:", {
      fontSize: "11px", fontStyle: "bold", color: "#006644", fontFamily: "monospace",
    }).setOrigin(0, 0.5).setDepth(5);

    this.tickerX = W;
    this.tickerText = this.add.text(this.tickerX, tickerBarY,
      TICKER_MSGS[this.tickerIndex], {
        fontSize: "11px", color: "#004433", fontFamily: "monospace",
      }
    ).setOrigin(0, 0.5).setDepth(5);

    // Mask ticker to keep it within the bar
    const mask = this.add.graphics();
    mask.fillRect(60, tickerBarY - 13, W - 68, 26);
    this.tickerText.setMask(mask.createGeometryMask());

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  update(_t: number, delta: number) {
    if (!this.tickerText) return;
    this.tickerX -= delta * 0.12;
    this.tickerText.setX(this.tickerX);

    // Reset when fully off-screen left
    if (this.tickerX + this.tickerText.width < 60) {
      this.tickerIndex = (this.tickerIndex + 1) % TICKER_MSGS.length;
      this.tickerText.setText(TICKER_MSGS[this.tickerIndex]);
      this.tickerX = this.cameras.main.width;
    }
  }

  private makePixelButton(
    x: number, y: number, label: string,
    color: string, bg: string,
  ) {
    const btn = this.add.text(x, y, label, {
      fontSize:        "16px",
      fontStyle:       "bold",
      color,
      fontFamily:      "monospace",
      stroke:          "#001111",
      strokeThickness: 3,
      backgroundColor: bg,
      padding:         { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });

    btn.on("pointerover",  () => btn.setColor("#ffffff"));
    btn.on("pointerout",   () => btn.setColor(color));
    btn.on("pointerover",  () => this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 100 }));
    btn.on("pointerout",   () => this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 }));

    return btn;
  }
}