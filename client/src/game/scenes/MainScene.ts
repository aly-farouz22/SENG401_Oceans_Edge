import Phaser from "phaser";
import Boat from "../objects/boat/Boat";
import FishingZone from "../objects/FishingZone";
import HUD from "../objects/HUD";
import MarketZone from "../objects/MarketZone";
import SeasonManager from "../objects/SeasonManager";

export default class MainScene extends Phaser.Scene {
  private boat!:          Boat;
  private hud!:           HUD;
  private seasonManager!: SeasonManager;
  private fishingZones:   FishingZone[] = [];

  constructor() {
    super("MainScene");
  }

  preload() {
    this.load.image("boat", "/assets/boat.png");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0a3d6b");

    this.fishingZones = [
      new FishingZone(this, 200, 250, 100, 100, "Shallow Reef"),
      new FishingZone(this, 700, 500, 120, 120, "Deep Waters"),
      new FishingZone(this, 450, 620, 90,  90,  "Coral Bed"),
    ];

    const marketZones = [
      new MarketZone(this, 880, 120, 120, 80, "Market Dock"),
    ];



    this.seasonManager = new SeasonManager(this);
    this.seasonManager.registerZones(this.fishingZones);

    this.boat = new Boat(this, 500, 384);
    this.boat.registerZones(this.fishingZones);
    this.boat.registerMarketZones(marketZones);

    this.hud = new HUD(this);

    // Sold fish but stayed in season
    this.boat.onSell = (earned, count) => {
      this.hud.showSellFeedback(earned, count);
    };

    // Sold fish AND ended the season
    this.boat.onEndSeason = (earned, count) => {
      this.hud.showSellFeedback(earned, count);
      this.seasonManager.advanceSeason();
    };

    this.seasonManager.onSeasonChange = (season, seasonName) => {
      this.hud.showSeasonBanner(season, seasonName);
    };
  }

  update(time: number, delta: number) {
    this.boat.update();
    this.hud.update(
      this.boat.money,
      this.boat.fish,
      this.seasonManager.season,
      this.seasonManager.seasonName
    );
    this.fishingZones
      .filter(z => !z.isGone)
      .forEach(z => z.updateRegen(delta));
  }
}