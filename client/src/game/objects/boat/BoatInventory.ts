import Phaser from "phaser";
import { EconomySystem } from "../../systems/EconomySystem";
import { FishCatch } from "../FishingZone";
import MarketZone from "../MarketZone";

export default class BoatInventory {
  private scene:       Phaser.Scene;
  private sprite:      Phaser.Physics.Arcade.Sprite;
  private marketZones: MarketZone[] = [];
  private economy:     EconomySystem | null = null;

  private atMarketLastFrame = false;
  private marketPrompt: Phaser.GameObjects.Text;

  fish:  FishCatch[] = [];

  // Always read money from EconomySystem if available, else local fallback
  private _money = 0;
  get money() {
    return this.economy ? this.economy.getBalance() : this._money;
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

        const count = inventory.length;
        let earned  = 0;

        if (this.economy) {
          // Use EconomySystem for pricing
          const catches = inventory.map(f => ({ fishName: f.name, amount: f.amount ?? 1 }));
          earned = this.economy.processFishingTrip(catches);
          // If processFishingTrip returns 0 (names don't match price list), fall back to points
          if (earned === 0) {
            earned = inventory.reduce((sum, f) => sum + f.points, 0);
            this.economy.addRevenue(earned);
          }
        } else {
          // Fallback: use fish.points directly
          earned = inventory.reduce((sum, f) => sum + f.points, 0);
          this._money += earned;
        }

        this.fish = [];

        if (choice === "sell") {
          this.onSell?.(earned, count);
        } else if (choice === "end_season") {
          this.onEndSeason?.(earned, count);
        } else if (choice === "upgrade") {
          this.onUpgrade?.();
        }
      };
    });
  }

  addFish(fish: FishCatch) {
    this.fish.push(fish);
  }

  update(isAtMarket: boolean) {
    const { x, y } = this.sprite;

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