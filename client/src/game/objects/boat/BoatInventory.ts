import Phaser from "phaser";
import { EconomySystem } from "../../systems/EconomySystem";
import { FishCatch } from "../FishingZone";
import MarketZone from "../MarketZone";
import BoatUpgrade from "./BoatUpgrade";

export default class BoatInventory {
  private scene:       Phaser.Scene;
  private sprite:      Phaser.Physics.Arcade.Sprite;
  private marketZones: MarketZone[] = [];
  private economy:     EconomySystem | null = null;
  private upgrades:    BoatUpgrade | null = null;

  private atMarketLastFrame = false;
  private marketPrompt:  Phaser.GameObjects.Text;
  private fullWarning:   Phaser.GameObjects.Text | null = null;
  private capacityText:  Phaser.GameObjects.Text;

  fish: FishCatch[] = [];

  private _money = 0;
  get money() {
    return this.economy ? this.economy.getBalance() : this._money;
  }

  get capacity(): number {
    return this.upgrades?.getInventoryCapacity() ?? 10;
  }

  onSell?:      (earned: number, count: number) => void;
  onEndSeason?: (earned: number, count: number) => void;
  onUpgrade?:   () => void;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite, economy?: EconomySystem) {
    this.scene   = scene;
    this.sprite  = sprite;
    this.economy = economy ?? null;

    this.marketPrompt = scene.add.text(0, 0, "Sail to dock to sell", {
      fontSize: "12px", color: "#ffdd88",
      stroke: "#332200", strokeThickness: 2, fontFamily: "monospace",
    }).setOrigin(0.5, 0).setVisible(false).setDepth(10);

    // Capacity indicator shown above the boat
    this.capacityText = scene.add.text(0, 0, "", {
      fontSize: "11px", color: "#a0e8ff",
      stroke: "#000", strokeThickness: 2, fontFamily: "monospace",
    }).setOrigin(0.5, 0).setVisible(false).setDepth(10);
  }

  registerUpgrades(upgrades: BoatUpgrade) {
    this.upgrades = upgrades;
  }

  registerMarketZones(zones: MarketZone[]) {
    this.marketZones = zones;

    zones.forEach(zone => {
      zone.onChoice = (choice, inventory) => {
        if (choice === "cancel") return;
        if (choice === "upgrade") {
          this.onUpgrade?.();
          return;
        }

        const count  = inventory.length;
        const earned = inventory.reduce((sum, f) => sum + f.points, 0);

        if (choice === "sell") {
          if (this.economy) {
            this.economy.addRevenue(earned);
          } else {
            this._money += earned;
          }
        }

        this.fish = [];

        if (choice === "sell") {
          this.onSell?.(earned, count);
        } else if (choice === "end_season") {
          this.onEndSeason?.(earned, count);
        }
      };
    });
  }

  addFish(fish: FishCatch): boolean {
    if (this.fish.length >= this.capacity) {
      this.showFullWarning();
      return false;
    }
    this.fish.push(fish);
    return true;
  }

  private showFullWarning() {
    if (this.fullWarning?.visible) return;

    if (!this.fullWarning) {
      this.fullWarning = this.scene.add.text(
        this.sprite.x, this.sprite.y - 50,
        "🚫 Inventory Full!", {
          fontSize: "13px", color: "#ff4444",
          fontFamily: "monospace", stroke: "#000", strokeThickness: 3,
          backgroundColor: "#220000", padding: { x: 8, y: 4 },
        }
      ).setOrigin(0.5).setDepth(15);
    }

    this.fullWarning
      .setPosition(this.sprite.x, this.sprite.y - 50)
      .setVisible(true)
      .setAlpha(1);

    this.scene.tweens.add({
      targets: this.fullWarning,
      alpha: 0,
      y: this.sprite.y - 80,
      duration: 1500,
      ease: "Cubic.easeOut",
      onComplete: () => this.fullWarning?.setVisible(false),
    });
  }

  update(isAtMarket: boolean) {
    const { x, y } = this.sprite;

    // Show capacity indicator when fish are in inventory
    const isFull = this.fish.length >= this.capacity;
    this.capacityText
      .setPosition(x, y + 34)
      .setText(`🐟 ${this.fish.length}/${this.capacity}`)
      .setColor(isFull ? "#ff4444" : "#a0e8ff")
      .setVisible(this.fish.length > 0 && !isAtMarket);

    this.marketPrompt
      .setPosition(x, y + 20)
      .setVisible(!isAtMarket && this.fish.length > 0);

    if (isAtMarket && !this.atMarketLastFrame) {
      const zone = this.marketZones[0];
      if (zone && !zone.menuOpen) {
        zone.showMenu(this.fish);
      }
    }

    if (!isAtMarket && this.atMarketLastFrame) {
      this.marketZones.forEach(z => z.hideMenu());
    }

    this.atMarketLastFrame = isAtMarket;
  }
}