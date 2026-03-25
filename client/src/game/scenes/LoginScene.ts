import Phaser from "phaser";
import { setCurrentUsername } from "./BootScene";
import { AchievementManager } from "../achievements/AchievementManager";

export default class LoginScene extends Phaser.Scene {
  private usernameValue = "";
  private inputEl!: HTMLInputElement;
  private inputDom!: Phaser.GameObjects.DOMElement;
  private errorText!: Phaser.GameObjects.Text;
  private submitBtn!: Phaser.GameObjects.Text;
  private cursorBlink!: Phaser.Time.TimerEvent;

  constructor() { super("LoginScene"); }

  create() {
    const W  = this.cameras.main.width;
    const H  = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;

    // ── Background ─────────────────────────────────────────────────────────
    this.add.image(cx, cy, "boot_bg").setDisplaySize(W, H).setDepth(0);
    // Dark overlay
    this.add.rectangle(cx, cy, W, H, 0x000d1a, 0.88).setDepth(1);

    // ── Scanline effect (retro CRT feel) ──────────────────────────────────
    for (let y = 0; y < H; y += 4) {
      this.add.rectangle(cx, y, W, 1, 0x000000, 0.12).setDepth(2);
    }

    // ── Pixel border frame ────────────────────────────────────────────────
    const bw = 460, bh = 380;
    const bx = cx - bw / 2, by = cy - bh / 2;
    // Outer border
    this.add.rectangle(cx, cy, bw, bh).setStrokeStyle(3, 0x00cc88).setDepth(3);
    // Inner border
    this.add.rectangle(cx, cy, bw - 8, bh - 8).setStrokeStyle(1, 0x006644).setDepth(3);
    // Corner pixels (8-bit style)
    const corners = [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]];
    corners.forEach(([x, y]) => {
      this.add.rectangle(x, y, 10, 10, 0x00ffaa).setDepth(4);
    });

    // ── ASCII-style title ─────────────────────────────────────────────────
    this.add.text(cx, by + 36, "[ OCEAN'S EDGE ]", {
      fontSize:        "22px",
      fontStyle:       "bold",
      color:           "#00ffaa",
      fontFamily:      "monospace",
      stroke:          "#003322",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);

    // ── Pixel divider ─────────────────────────────────────────────────────
    const divY = by + 70;
    for (let x = bx + 20; x < bx + bw - 20; x += 8) {
      this.add.rectangle(x, divY, 4, 2, 0x006644).setDepth(3);
    }

    // ── Prompt text ───────────────────────────────────────────────────────
    this.add.text(cx, by + 100, "IDENTIFY YOURSELF, CAPTAIN", {
      fontSize:   "13px",
      color:      "#44ccff",
      fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(4);

    this.add.text(cx, by + 125, "Enter your captain's name to begin:", {
      fontSize:   "12px",
      color:      "#336677",
      fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(4);

    // ── DOM Input ─────────────────────────────────────────────────────────
    this.inputEl = document.createElement("input");
    this.inputEl.type        = "text";
    this.inputEl.placeholder = "e.g. captain123";
    this.inputEl.maxLength   = 20;
    this.inputEl.autocomplete = "off";
    this.inputEl.style.cssText = `
      width: 260px;
      padding: 10px 14px;
      font-size: 16px;
      font-family: monospace;
      background: #000d1a;
      color: #00ffaa;
      border: 2px solid #00cc88;
      border-radius: 0px;
      outline: none;
      text-align: center;
      letter-spacing: 2px;
      caret-color: #00ffaa;
    `;
    this.inputDom = this.add.dom(cx, by + 185, this.inputEl).setDepth(10);
    this.inputEl.addEventListener("input", () => {
      this.usernameValue = this.inputEl.value.trim();
      this.errorText.setVisible(false);
    });
    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.onSubmit();
    });

    // ── Character counter ─────────────────────────────────────────────────
    const charCount = this.add.text(cx + 148, by + 198, "0/20", {
      fontSize:   "10px",
      color:      "#224433",
      fontFamily: "monospace",
    }).setOrigin(0, 0.5).setDepth(4);
    this.inputEl.addEventListener("input", () => {
      charCount.setText(`${this.inputEl.value.length}/20`);
    });

    // ── Error text ────────────────────────────────────────────────────────
    this.errorText = this.add.text(cx, by + 230, "", {
      fontSize:   "12px",
      color:      "#ff4455",
      fontFamily: "monospace",
    }).setOrigin(0.5).setDepth(4).setVisible(false);

    // ── Submit button ─────────────────────────────────────────────────────
    this.submitBtn = this.add.text(cx, by + 280, "[ ENTER THE SEA ]", {
      fontSize:        "18px",
      fontStyle:       "bold",
      color:           "#00ffaa",
      fontFamily:      "monospace",
      stroke:          "#003322",
      strokeThickness: 3,
      backgroundColor: "#001a0d",
      padding:         { x: 24, y: 12 },
    }).setOrigin(0.5).setDepth(4).setInteractive({ useHandCursor: true });

    this.submitBtn.on("pointerover", () => {
      this.submitBtn.setColor("#ffffff").setBackgroundColor("#003322");
    });
    this.submitBtn.on("pointerout", () => {
      this.submitBtn.setColor("#00ffaa").setBackgroundColor("#001a0d");
    });
    this.submitBtn.on("pointerdown", () => this.onSubmit());

    // Pulse animation
    this.tweens.add({
      targets:  this.submitBtn,
      scaleX:   1.03, scaleY: 1.03,
      duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    // ── Pixel fish decorations ────────────────────────────────────────────
    this.add.text(bx + 20, by + bh - 30, "><>  ><>  ><>", {
      fontSize: "12px", color: "#113322", fontFamily: "monospace",
    }).setDepth(3);
    this.add.text(bx + bw - 140, by + bh - 30, "<><  <><  <><", {
      fontSize: "12px", color: "#113322", fontFamily: "monospace",
    }).setDepth(3);

    // ── Version tag ───────────────────────────────────────────────────────
    this.add.text(W - 10, H - 10, "v1.0 © OCEAN'S EDGE", {
      fontSize: "10px", color: "#112233", fontFamily: "monospace",
    }).setOrigin(1, 1).setDepth(4);

    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Focus input
    this.time.delayedCall(600, () => this.inputEl.focus());
  }

  private async onSubmit() {
    if (!this.usernameValue) {
      this.inputEl.style.borderColor = "#ff4455";
      this.errorText.setText(">> ERROR: Name cannot be empty!").setVisible(true);
      this.time.delayedCall(1000, () => {
        this.inputEl.style.borderColor = "#00cc88";
      });
      return;
    }
    if (this.usernameValue.length < 3) {
      this.errorText.setText(">> ERROR: Name must be 3+ characters").setVisible(true);
      return;
    }

    setCurrentUsername(this.usernameValue);

    // Switch achievements to database storage for this specific player
    // so badges are isolated per username instead of shared in localStorage
    await AchievementManager.instance.switchToDbStorage(this.usernameValue);

    this.inputDom.destroy();

    // Flash submit button before transitioning
    this.tweens.add({
      targets:  this.submitBtn,
      alpha:    0,
      duration: 100,
      yoyo:     true,
      repeat:   3,
      onComplete: () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("HomeScene");
        });
      },
    });
  }
}