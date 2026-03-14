import Phaser from "phaser";
import Boat from "../objects/boat/Boat";
import FishingZone from "../objects/FishingZone";
import HUD from "../objects/HUD";
import MarketZone from "../objects/MarketZone";
import SeasonManager from "../objects/SeasonManager";
import { EconomySystem } from "../systems/EconomySystem";
import { EcosystemSystem } from "../systems/EcosystemSystem";

export default class MainScene extends Phaser.Scene {
  private boat!:          Boat;
  private hud!:           HUD;
  private seasonManager!: SeasonManager;
  private fishingZones:   FishingZone[] = [];
  private ecosystem!:     EcosystemSystem;
  private economy!:       EconomySystem;
  private marketZones:    MarketZone[] = [];

  constructor() { super("MainScene"); }

  preload() {
    this.load.image("boat",           "/assets/boat.png");
    this.load.image("fish_anchovy",   "/assets/Anchovy_Sprat_Common.png");
    this.load.image("fish_aurora",    "/assets/Aurora_Trout_Endangered.png");
    this.load.image("fish_crab",      "/assets/European_Green_Crab_Invasive.png");
    this.load.image("fish_haddock",   "/assets/Haddock_Common.png");
    this.load.image("fish_lionfish",  "/assets/Lionfish_Invasive.png");
    this.load.image("fish_swordfish", "/assets/North_Atlantic_Swordfish_Common.png");
    this.load.image("fish_opah",      "/assets/Opah_Fish_Common.png");
    this.load.image("fish_halibut",   "/assets/Pacific_Halibut_Common.png");
    this.load.image("fish_snapper",   "/assets/Red_Snapper_Common.png");
    this.load.image("fish_bluefin",   "/assets/Southern_Bluefin_Tuna_Endangered.png");
    this.load.image("upgrade_fuel",   "/assets/Fuel_Upgrade.png");
    this.load.image("upgrade_net",    "/assets/Net_Upgrade.png");
    this.load.image("trash_bottle",   "/assets/water_bottle_trash__1_.png");
    this.load.image("trash_cigarette","/assets/Cigarette_Buds_Trash.png");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0a3d6b");

    this.ecosystem = new EcosystemSystem();
    this.economy   = new EconomySystem();

    // Give player starting balance so they can see money working
    this.economy.addRevenue(0);

    this.fishingZones = [
      new FishingZone(this, 150, 200, 100, 100, "Shallow Reef"),
      new FishingZone(this, 400, 300, 120, 120, "Deep Waters"),
      new FishingZone(this, 650, 250, 140, 140, "Coral Bed"),
    ];

    this.marketZones = [
      new MarketZone(this, 880, 120, 120, 80, "Market Dock"),
    ];

    this.seasonManager = new SeasonManager(this, this.ecosystem);
    this.seasonManager.registerZones(this.fishingZones);

    this.boat = new Boat(this, 500, 384, this.ecosystem, this.economy);
    this.boat.registerZones(this.fishingZones);
    this.boat.registerMarketZones(this.marketZones);
    this.marketZones.forEach(z => z.registerUpgrades(this.boat.upgrades));

    this.hud = new HUD(this);

    this.boat.onSell = (earned, count) => {
      this.hud.showSellFeedback(earned, count);
    };

    this.boat.onEndSeason = (earned, count) => {
      this.hud.showSellFeedback(earned, count);
      this.economy.updateSeason();
      this.seasonManager.advanceSeason();
    };

    this.seasonManager.onSeasonChange = (season, seasonName) => {
      this.hud.showSeasonBanner(season, seasonName);
    };
  }

  update(time: number, delta: number) {
    this.boat.tick();
    this.seasonManager.update(delta);
    this.hud.update(
      this.boat.money,
      this.boat.fish,
      this.seasonManager.season,
      this.seasonManager.seasonName,
      this.ecosystem.getState()
    );
    this.fishingZones
      .filter(z => !z.isGone)
      .forEach(z => z.updateRegen(delta));
  }
}