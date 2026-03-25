import Phaser from "phaser";
import { logChoice, saveGame, saveOutcome } from "../../services/api";
import { AchievementManager } from "../achievements/AchievementManager";
import { AchievementToast } from "../achievements/AchievementToast";
import Boat from "../objects/boat/Boat";
import FishingZone from "../objects/FishingZone";
import HUD from "../objects/HUD";
import MarketZone from "../objects/MarketZone";
import PauseMenu from "../objects/PauseMenu";
import SeasonEndScreen from "../objects/SeasonEndScreen";
import SeasonManager from "../objects/SeasonManager";
import SeasonObjectivePopup from "../objects/SeasonObjectivePopup";
import TrashZone from "../objects/TrashZone";
import { EconomySystem } from "../systems/EconomySystem";
import { EcosystemSystem } from "../systems/EcosystemSystem";
import { EventSystem } from "../systems/EventSystem";
import ObjectiveSystem from "../systems/ObjectiveSystem";
import { currentUsername } from "./BootScene";

export default class MainScene extends Phaser.Scene {
  private boat!:          Boat;
  private hud!:           HUD;
  private seasonManager!: SeasonManager;
  private fishingZones:   FishingZone[] = [];
  private trashZones:     TrashZone[] = [];
  private ecosystem!:     EcosystemSystem;
  private economy!:       EconomySystem;
  private marketZones:    MarketZone[] = [];
  private eventSystem!:   EventSystem;
  private pauseMenu!:     PauseMenu;
  private toast!:         AchievementToast;
  private objectives!:    ObjectiveSystem;
  private hasGameEnded =  false;
  private sceneReady   =  false;

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
    this.load.image("payment_bg",     "/assets/Payment.png");
    this.load.image("ocean_bg",       "/assets/Ocean_bg.png");
    this.load.image("market_dock",    "/assets/Harbour.png");
    this.load.image("fishing_zone",   "/assets/FishingZone.png");
    this.load.image("ui_bar",         "/assets/UI.png");
    this.load.image("fuel_bar",       "/assets/FuelBar.png");
    this.load.image("pause_btn",      "/assets/Pause.png");
    this.load.image("collection_bg",  "/assets/Collection.png");
    this.load.image("compass",        "/assets/Compass.png");
  }

  create() {
    this.sceneReady   = false;
    this.hasGameEnded = false;

    // Read saved state passed from MenuScene when player clicks Load Game.
    // MenuScene passes { savedGame: saved } so we read savedGame.state
    const sceneData  = this.scene.settings.data as any;
    const savedState = sceneData?.savedGame?.state ?? null;

    AchievementManager.instance.init().then(() => {
      const cam = this.cameras.main;
      const W = this.scale.width;
      const H = this.scale.height;

      this.add.image(0, 0, "ocean_bg")
        .setOrigin(0, 0)
        .setDisplaySize(W, H)
        .setScrollFactor(0)
        .setDepth(0);

      // ── Compass (bottom-left, decorative) ──────────────────────────────────
      this.add.image(110, cam.height - 150, "compass")
        .setDisplaySize(200, 200)
        .setScrollFactor(0)
        .setDepth(1)
        .setAlpha(0.35);

      this.toast = new AchievementToast(this);
      AchievementManager.instance.onUnlock = (def) => this.toast.show(def);

      this.ecosystem   = new EcosystemSystem();
      this.economy     = new EconomySystem();
      this.eventSystem = new EventSystem(this.economy, this.ecosystem);
      this.objectives  = new ObjectiveSystem();

      this.economy.addRevenue(0);

      // ── Apply saved economy and ecosystem state ───────────────────────────
      // Restores money, coral health and pollution from the database.
      // Runs after systems are initialized so we can safely set values.
      if (savedState) {
        if (typeof savedState.money         === "number") this.economy.getState().balance            = savedState.money;
        if (typeof savedState.coralHealth   === "number") this.ecosystem.getState().coralHealth      = savedState.coralHealth;
        if (typeof savedState.pollutionLevel=== "number") this.ecosystem.getState().pollutionLevel   = savedState.pollutionLevel;
      }

      this.fishingZones = [
        new FishingZone(this, 150, 350, 100, 100, "Shallow Reef"),
        new FishingZone(this, 400, 300, 120, 120, "Deep Waters"),
        new FishingZone(this, 650, 250, 140, 140, "Coral Bed"),
      ];

      this.marketZones = [
        new MarketZone(this, 880, 120, 120, 80, "Market Dock"),
      ];

      AchievementManager.instance.updateStats({ totalTrashZones: 0 });

      this.seasonManager = new SeasonManager(this, this.ecosystem);
      this.seasonManager.registerZones(this.fishingZones);

      // Restore saved season number after SeasonManager is created
      if (savedState && typeof savedState.season === "number" && savedState.season > 1) {
        this.seasonManager.season     = savedState.season;
        this.seasonManager.seasonName = this.getSeasonName(savedState.season);
      }

      this.boat = new Boat(this, 500, 384, this.ecosystem, this.economy);
      this.boat.registerZones(this.fishingZones);
      this.boat.registerMarketZones(this.marketZones);
      this.marketZones.forEach(z => z.registerUpgrades(this.boat.upgrades));
      this.marketZones.forEach(z => z.registerFuel(this.boat.fuelSystem, this.economy));

      // ── Restore fuel and fish inventory after boat is created ─────────────
      // Must run after new Boat() so fuelSystem and inventory exist.
      if (savedState) {
        if (typeof savedState.fuel === "number") this.boat.fuelSystem.setFuel(savedState.fuel);
        if (Array.isArray(savedState.fish))      savedState.fish.forEach((f: any) => this.boat.inventory.addFish(f));
      }

      this.hud = new HUD(this);
      this.hud.registerFuel(this.boat.fuelSystem);
      this.hud.onEndangeredLimit = () => {
        this.hasGameEnded = true;
        this.showEvent("💀 Game Over", "You caught too many endangered species!");
        this.scene.pause();
      };

      this.pauseMenu = new PauseMenu(this);
      this.hud.onMenuOpen = () => this.pauseMenu.open();
      this.pauseMenu.onResume = () => {};
      this.pauseMenu.onExitToMenu = () => { this.scene.restart(); };
      this.pauseMenu.getGameState = () => ({
        money:          this.economy.getBalance(),
        season:         this.seasonManager.season,
        coralHealth:    this.ecosystem.getState().coralHealth,
        pollutionLevel: this.ecosystem.getState().pollutionLevel,
        fuel:           this.boat.fuelSystem.fuel,
        fish:           this.boat.fish,
      });

      // ── Towing fee ────────────────────────────────────────────────────────
      this.boat.boatMovement.onFuelEmpty = () => {
        const TOWING_FEE = 300;
        this.economy.getState().balance       -= TOWING_FEE;
        this.economy.getState().totalExpenses += TOWING_FEE;
        const dock = this.marketZones[0];
        this.boat.setPosition(dock.x, dock.y + 100);
        this.showEvent("🚤 Towed to Dock",
          `You ran out of fuel and were towed back for $${TOWING_FEE}!`);
      };

      // ── Collection tracking ───────────────────────────────────────────────
      // Register each non-trash catch with the HUD collection
      const origOnCatch = this.boat.fishing.onCatch;
      this.boat.fishing.onCatch = (fish) => {
        origOnCatch?.(fish);
        if (fish.rarity !== "trash") {
          const id = fish.name.toLowerCase().replace(/\s+/g, "_");
          this.hud.registerCatch(id);
        }
        if (fish.endangered) {
          this.objectives.updateStats({ endangeredCaught: 1 });
          this.hud.registerEndangeredCatch();
        }
      };

      this.eventSystem.onSpawnTrash = (x, y) => { this.spawnTrashZone(x, y); };

      this.boat.onSell = (earned, count) => {
        AchievementManager.instance.updateStats({ lifetimeEarnings: earned });
        // ── Objective: money earned ──────────────────────────────────────
        this.objectives.updateStats({ moneyEarned: earned });
        this.hud.showSellFeedback(earned, count);

        if (currentUsername) {
          saveGame(currentUsername, {
            money:          this.economy.getBalance(),
            season:         this.seasonManager.season,
            coralHealth:    this.ecosystem.getState().coralHealth,
            pollutionLevel: this.ecosystem.getState().pollutionLevel,
            fuel:           this.boat.fuelSystem.fuel,
            fish:           this.boat.fish,
          });
        }
      };

      this.boat.onEndSeason = (earned, count) => {
        const econState = this.economy.getState();
        const season    = this.seasonManager.season;

        const screen = new SeasonEndScreen(this);
        screen.show({
          earnings:        earned,
          fuelCost:        econState.fuelCost,
          licenseFee:      20,
          maintenanceCost: econState.maintenanceCost,
          currentBalance:  econState.balance,
        });

        screen.onComplete = (canContinue) => {
          const totalCosts = econState.fuelCost + 20 + econState.maintenanceCost;
          econState.balance += earned;
          econState.balance -= totalCosts;

          if (econState.balance < 0) {
            AchievementManager.instance.updateStats({ gameOverCount: 1 });
            this.hasGameEnded = true;
            this.showEvent("💀 Game Over", "You couldn't cover your seasonal costs!");

            if (currentUsername) {
              const ecoState = this.ecosystem.getState();
              const extinct  = ecoState.fishPopulations
                .filter(f => f.population <= 0).map(f => f.name as string);
              saveOutcome(currentUsername, "bankrupt",
                Math.floor(econState.balance), season,
                ecoState.coralHealth, ecoState.pollutionLevel, extinct);
            }
            this.scene.pause();
            return;
          }

          // ── Evaluate season objectives ─────────────────────────────────
          this.objectives.evaluateSeason(canContinue);

          AchievementManager.instance.updateStats({ seasonsCompleted: 1 });
          if (econState.balance - earned + totalCosts < 0) {
            AchievementManager.instance.updateStats({ recoveredFromNegative: true });
          }

          this.hud.showSellFeedback(earned, count);
          this.economy.updateSeason();

          if (currentUsername) {
            saveGame(currentUsername, {
              money:          econState.balance,
              season:         this.seasonManager.season,
              coralHealth:    this.ecosystem.getState().coralHealth,
              pollutionLevel: this.ecosystem.getState().pollutionLevel,
              fuel:           this.boat.fuelSystem.fuel,
              fish:           this.boat.fish,
            });
            logChoice(currentUsername, "season_completed", {
              season:  this.seasonManager.season,
              balance: econState.balance,
            });
          }

          const event = this.eventSystem.triggerRandomEvent();
          if (event) this.showEvent(event.title, event.description);
          const crisis = this.eventSystem.checkLowPopulationEvent();
          if (crisis) this.showEvent(crisis.title, crisis.description);

          this.seasonManager.advanceSeason();
          this.boat.fuelSystem.refuelFree();

          // ── Spawn extra trash zones each season ────────────────────────────
          const extraTrash   = Math.min(Math.floor(this.seasonManager.season / 2), 3);
          for (let t = 0; t < extraTrash; t++) {
            const tx = Phaser.Math.Between(80, this.cameras.main.width  - 80);
            const ty = Phaser.Math.Between(80, this.cameras.main.height - 150);
            this.spawnTrashZone(tx, ty);
          }
          AchievementManager.instance.updateStats({
            totalTrashZones: 3 + this.trashZones.length,
          });

          // ── Start next season objectives + show popup ──────────────────
          const nextSeason = season + 1;
          this.objectives.startSeason(nextSeason);
          const popup = new SeasonObjectivePopup(this);
          popup.onClose = () => {};
          popup.show(this.objectives, nextSeason);
        };
      };

      this.seasonManager.onSeasonChange = (season, seasonName) => {
        this.hud.showSeasonBanner(season, seasonName);
      };

      // Start objectives for current season (saved or 1)
      const startSeason = savedState?.season ?? 1;
      this.objectives.startSeason(startSeason);

      // Only show the intro popup for new games, skip it when loading a save
      if (savedState) {
        this.sceneReady = true;
      } else {
        const introPopup = new SeasonObjectivePopup(this);
        introPopup.onClose = () => { this.sceneReady = true; };
        introPopup.show(this.objectives, startSeason);
        // sceneReady is set true inside introPopup.onClose
      }
    });
  }

  // ── Helper: get season name from season number ────────────────────────────
  private getSeasonName(season: number): string {
    const SEASON_NAMES = ["Spring", "Summer", "Autumn", "Winter"];
    return SEASON_NAMES[(season - 1) % SEASON_NAMES.length];
  }

  private spawnTrashZone(x: number, y: number) {
    const zone = new TrashZone(this, x, y, 100, 100, this.ecosystem);
    this.trashZones.push(zone);

    // Give the zone access to fishing zones so it can seep into nearest one
    zone.fishingZones = this.fishingZones;

    zone.onSeepStart = () => {
      this.showEvent(
        "☠ Trash Seeping!",
        "An uncleaned trash zone is now draining a nearby fishing area!"
      );
    };

    zone.onCleaned = () => {
      this.showEvent("Trash Cleaned! 🌊", "Pollution reduced and fish populations boosted.");
      this.trashZones = this.trashZones.filter(z => z !== zone);

      // ── Objective: trash cleaned ─────────────────────────────────────
      this.objectives.updateStats({ trashZonesCleaned: 1 });

      if (currentUsername) {
        logChoice(currentUsername, "cleaned_trash", { season: this.seasonManager.season });
      }
    };

    this.boat.registerTrashZones(this.trashZones);
  }

  update(time: number, delta: number) {
    if (!this.sceneReady) return;

    const ecoState       = this.ecosystem.getState();
    const pollutionLevel = ecoState.pollutionLevel;

    this.fishingZones
      .filter(z => !z.isGone)
      .forEach(z => z.setPollution(pollutionLevel));

    this.trashZones
      .filter(z => !z.isGone)
      .forEach(z => z.update(delta));

    this.boat.tick(delta);

    this.seasonManager.update(delta);
    this.hud.update(
      this.boat.money,
      this.boat.fish,
      this.seasonManager.season,
      this.seasonManager.seasonName,
      ecoState
    );

    // ── Objective: ecosystem health (update each frame) ─────────────────
    this.objectives.updateStats({ ecosystemHealth: ecoState.coralHealth });

    this.fishingZones
      .filter(z => !z.isGone)
      .forEach(z => z.updateRegen(delta));

    if (!this.hasGameEnded && this.ecosystem.isGameOver()) {
      this.hasGameEnded = true;
      this.scene.pause();

      if (currentUsername) {
        const extinct = ecoState.fishPopulations
          .filter(f => f.population <= 0).map(f => f.name as string);
        saveOutcome(currentUsername, "ecosystem_collapse",
          Math.floor(this.economy.getBalance()), this.seasonManager.season,
          ecoState.coralHealth, ecoState.pollutionLevel, extinct);
      }

      this.showEvent("Game Over", "The ecosystem has collapsed.");
    }
  }

  private activeEventTexts: Phaser.GameObjects.Text[] = [];

  private showEvent(title: string, description: string) {
    const cam     = this.cameras.main;
    const cx      = cam.width / 2;
    const spacing = 80;
    const startY  = 60;
    const y       = startY + this.activeEventTexts.length * spacing;

    const text = this.add.text(cx, y, `${title}\n${description}`, {
      fontSize: "20px", fontStyle: "bold", color: "#ffee88",
      fontFamily: "monospace", backgroundColor: "#002233",
      padding: { x: 20, y: 10 }, align: "center",
      wordWrap: { width: cam.width * 0.8 },
    }).setOrigin(0.5, 0);

    this.activeEventTexts.push(text);

    this.tweens.add({
      targets: text, alpha: 0, duration: 4000, ease: "Power2",
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