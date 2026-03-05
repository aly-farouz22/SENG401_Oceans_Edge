import Phaser from "phaser";
import { FishCatch } from "../FishingZone";
import MarketZone from "../MarketZone";

/**
 * Tracks the boat's fish inventory.
 * When the boat enters a market zone, it triggers the market menu.
 * Selling is handled externally via onSell / onEndSeason callbacks.
 */
export default class BoatInventory {
  private scene:       Phaser.Scene;
  private sprite:      Phaser.Physics.Arcade.Sprite;
  private marketZones: MarketZone[] = [];

  private atMarketLastFrame = false;
  private marketPrompt: Phaser.GameObjects.Text;

  fish:  FishCatch[] = [];
  money = 0;

  onSell?:      (earned: number, count: number) => void;
  onEndSeason?: (earned: number, count: number) => void;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
    this.scene  = scene;
    this.sprite = sprite;

    this.marketPrompt = scene.add.text(0, 0, "Sail to dock to sell", {
      fontSize: "12px", color: "#ffdd88",
      stroke: "#332200", strokeThickness: 2, fontFamily: "monospace",
    }).setOrigin(0.5, 1).setVisible(false).setDepth(10);
  }

  registerMarketZones(zones: MarketZone[]) {
    this.marketZones = zones;

    zones.forEach(zone => {
      zone.onChoice = (choice, inventory) => {
        if (choice === "cancel") return;

        const count  = inventory.length;
        const earned = zone.sellAll(inventory);
        this.money  += earned;
        this.fish    = [];

        if (choice === "sell") {
          this.onSell?.(earned, count);
        } else if (choice === "end_season") {
          this.onEndSeason?.(earned, count);
        }
      };
    });
  }

  addFish(fish: FishCatch) {
    this.fish.push(fish);
  }

  update(isAtMarket: boolean) {
    const { x, y } = this.sprite;

    // Show prompt only when away from market
    this.marketPrompt
      .setPosition(x, y - 28)
      .setVisible(!isAtMarket && this.fish.length > 0);

    // Trigger menu on first frame of entering the market
    if (isAtMarket && !this.atMarketLastFrame) {
      const zone = this.marketZones[0];
      if (zone && !zone.menuOpen) {
        zone.showMenu(this.fish);
      }
    }

    // Hide menu if boat leaves the market zone
    if (!isAtMarket && this.atMarketLastFrame) {
      this.marketZones.forEach(z => z.hideMenu());
    }

    this.atMarketLastFrame = isAtMarket;
  }
}