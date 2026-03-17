import Phaser from "phaser";
import Boat from "../objects/boat/Boat";
import FishingZone from "../objects/FishingZone";
import HUD from "../objects/HUD";
import MarketZone from "../objects/MarketZone";
import SeasonManager from "../objects/SeasonManager";
import TrashZone from "../objects/TrashZone";
import { EconomySystem } from "../systems/EconomySystem";
import { EcosystemSystem } from "../systems/EcosystemSystem";
import { EventSystem } from "../systems/EventSystem";

export default class MainScene extends Phaser.Scene {
  private boat!:          Boat;
  private hud!:           HUD;
  private seasonManager!: SeasonManager;
  private fishingZones:   FishingZone[] = [];
  private trashZones:     TrashZone[] = [];
  private ecosystem!:     EcosystemSystem;
  private economy!:       EconomySystem;
  private marketZones:    MarketZone[] = [];
  private events!:        EventSystem;

  constructor() { super("MainScene"); }

  preload() {
    this.load.image("boat",           "/assets/Boat.png");
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
    this.load.image("trash_bottle",   "/assets/Water_Bottle_Trash.png");
    this.load.image("trash_cigarette","/assets/Cigarette_Buds_Trash.png");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0a3d6b");

    this.ecosystem = new EcosystemSystem();
    this.economy   = new EconomySystem();
    this.events    = new EventSystem(this.economy, this.ecosystem);

    this.economy.addRevenue(0);

    this.fishingZones = [
      new FishingZone(this, 150, 350, 100, 100, "Shallow Reef"),
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

    this.events.onSpawnTrash = (x, y) => {
      this.spawnTrashZone(x, y);
    };

    this.boat.onSell = (earned, count) => {
      this.hud.showSellFeedback(earned, count);
    };

    this.boat.onEndSeason = (earned, count) => {
      this.hud.showSellFeedback(earned, count);
      this.economy.updateSeason();

      const event = this.events.triggerRandomEvent();
      if (event) this.showEvent(event.title, event.description);

      const crisis = this.events.checkLowPopulationEvent();
      if (crisis) this.showEvent(crisis.title, crisis.description);

      this.seasonManager.advanceSeason();
    };

    this.seasonManager.onSeasonChange = (season, seasonName) => {
      this.hud.showSeasonBanner(season, seasonName);
    };

    // Test trash zones — remove once confirmed working
    this.spawnTrashZone(250, 150);
    this.spawnTrashZone(600, 400);
    this.spawnTrashZone(750, 200);
  }

  private spawnTrashZone(x: number, y: number) {
    const zone = new TrashZone(this, x, y, 100, 100, this.ecosystem);
    this.trashZones.push(zone);

    zone.onCleaned = () => {
      this.showEvent("Trash Cleaned! 🌊", "Pollution reduced and fish populations boosted.");
      this.trashZones = this.trashZones.filter(z => z !== zone);
    };

    // Re-register all trash zones with the boat each time one spawns
    this.boat.registerTrashZones(this.trashZones);
  }

  update(time: number, delta: number) {
    const pollutionLevel = this.ecosystem.getState().pollution;

    this.fishingZones
      .filter(z => !z.isGone)
      .forEach(z => z.setPollution(pollutionLevel));

    this.trashZones
      .filter(z => !z.isGone)
      .forEach(z => z.update(delta));

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

  private activeEventTexts: Phaser.GameObjects.Text[] = [];

  private showEvent(title: string, description: string) {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const spacing = 80;
    const startY = 60;
    const y = startY + this.activeEventTexts.length * spacing;

    const text = this.add.text(cx, y, `${title}\n${description}`, {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffee88",
      fontFamily: "monospace",
      backgroundColor: "#002233",
      padding: { x: 20, y: 10 },
      align: "center",
      wordWrap: { width: cam.width * 0.8 },
    }).setOrigin(0.5, 0);

    this.activeEventTexts.push(text);

    this.tweens.add({
      targets: text,
      alpha: 0,
      duration: 4000,
      ease: "Power2",
      onComplete: () => {
        text.destroy();
        const index = this.activeEventTexts.indexOf(text);
        if (index >= 0) this.activeEventTexts.splice(index, 1);
        this.activeEventTexts.forEach((t, i) => {
          this.tweens.add({ targets: t, y: startY + i * spacing, duration: 200, ease: "Cubic.easeOut" });
        });
      },
    });
  }
}