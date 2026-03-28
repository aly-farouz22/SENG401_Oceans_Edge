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

/*MainScene is the core gameplay scene. It sets up and coordinates every
major system:
-the boat
-fishing zones
-economy
-ecosystem
-events
-achievements
-HUD. 
It also handles saving/loading game state.*/
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

  // Preload all image assets used in the game.
  // Phaser needs these loaded before create() runs
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
    const sceneData  = this.scene.settings.data as any;
    const savedState = sceneData?.savedGame ?? null;

    AchievementManager.instance.init().then(() => {
      const cam = this.cameras.main;
      const W = this.scale.width;
      const H = this.scale.height;

      this.add.image(0, 0, "ocean_bg")
        .setOrigin(0, 0)
        .setDisplaySize(W, H)
        .setScrollFactor(0)
        .setDepth(0);

      this.add.image(110, cam.height - 150, "compass")
        .setDisplaySize(200, 200)
        .setScrollFactor(0)
        .setDepth(15)
        .setAlpha(0.35);

      this.toast = new AchievementToast(this);
      AchievementManager.instance.onUnlock = (def) => this.toast.show(def);

      this.ecosystem   = new EcosystemSystem();
      this.economy     = new EconomySystem();
      this.eventSystem = new EventSystem(this.economy, this.ecosystem);
      this.objectives  = new ObjectiveSystem();

      this.economy.addRevenue(0);

      // Apply saved economy and ecosystem state
      // If loading a save, overwrite the fresh default values with the
      // values from the save file (money, pollution, fish populations, etc.)
      if (savedState) {
        if (typeof savedState.money         === "number") this.economy.getState().balance            = savedState.money;
        if (typeof savedState.coralHealth   === "number") this.ecosystem.getState().coralHealth      = savedState.coralHealth;
        if (typeof savedState.pollutionLevel=== "number") this.ecosystem.getState().pollutionLevel   = savedState.pollutionLevel;
        if (typeof savedState.acidityLevel     === "number") this.ecosystem.getState().acidityLevel     = savedState.acidityLevel;
        if (typeof savedState.biodiversityIndex=== "number") this.ecosystem.getState().biodiversityIndex= savedState.biodiversityIndex;
        if (typeof savedState.fuelCost        === "number") this.economy.getState().fuelCost         = savedState.fuelCost;
        if (typeof savedState.maintenanceCost === "number") this.economy.getState().maintenanceCost  = savedState.maintenanceCost;
        if (Array.isArray(savedState.fishPopulations)) {
          savedState.fishPopulations.forEach((saved: any) => {
            const fish = this.ecosystem.getState().fishPopulations.find(f => f.name === saved.name);
            if (fish) {
              fish.population       = saved.population;
              fish.caughtThisSeason = saved.caughtThisSeason;
              fish.regenerationRate = saved.regenerationRate;
            }
          });
        }
      }

      // Two initial zones, spread to opposite corners of the map
      this.fishingZones = [
        new FishingZone(this, 150, 380, 120, 120, "Shallow Reef"),
        new FishingZone(this, 700, 200, 120, 120, "Deep Waters"),
      ];

      // One market dock where the player sells fish and buys upgrades (key aspect).
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
      // Create the player boat and connect it to the game systems. This is our player
      this.boat = new Boat(this, 500, 384, this.ecosystem, this.economy);
      this.boat.registerZones(this.fishingZones);
      this.boat.registerMarketZones(this.marketZones);
      this.marketZones.forEach(z => z.registerUpgrades(this.boat.upgrades));
      this.marketZones.forEach(z => z.registerFuel(this.boat.fuelSystem, this.economy));

      // Restore fuel and fish inventory after boat is created
      // Must run after new Boat() so fuelSystem and inventory exist.
      if (savedState) {
        if (savedState.upgradeLevels) this.boat.upgrades.restoreLevels(savedState.upgradeLevels);
        if (typeof savedState.fuel === "number") this.boat.fuelSystem.setFuel(savedState.fuel);
        if (typeof savedState.boatX === "number" && typeof savedState.boatY === "number") {
          this.boat.setPosition(savedState.boatX, savedState.boatY);
        }
        if (Array.isArray(savedState.fish))      savedState.fish.forEach((f: any) => this.boat.inventory.addFish(f));
        if (Array.isArray(savedState.goneZones)) {// Destroy the zones that were depleted/gone in the save.
          savedState.goneZones.forEach((gone: boolean, i: number) => {
            if (gone && this.fishingZones[i]) {
              this.fishingZones[i].destroy();
            }
          });
        }
        // Restore the fish stock levels for zones that are still active.
        if (Array.isArray(savedState.zoneStocks)) {
          savedState.zoneStocks.forEach((stock: number, i: number) => {
            if (this.fishingZones[i] && !this.fishingZones[i].isGone) {
              this.fishingZones[i].stock = stock;
              this.fishingZones[i].refreshBar();
            }
          });
        }

        // Recreate any extra fishing zones that had been spawned mid game.
        if (Array.isArray(savedState.spawnedZones)) {
          savedState.spawnedZones.forEach((sz: any) => {
            const zone = new FishingZone(this, sz.x, sz.y, sz.size, sz.size, sz.name);
            this.fishingZones.push(zone);
            zone.stock = sz.stock;
            zone.refreshBar();
          });
          this.boat.registerZones(this.fishingZones);
          this.seasonManager.registerZones(this.fishingZones);
        } 
        
        // Recreate any trash zones that existed when the game was saved,
        // restoring their age and seeping state so they continue behaving correctly
        if (Array.isArray(savedState.trashZones)) {
          savedState.trashZones.forEach((tz: any) => {
            const zone = new TrashZone(this, tz.x, tz.y, 100, 100, this.ecosystem);
            this.trashZones.push(zone);
            zone.fishingZones       = this.fishingZones;
            zone.currentTrashStock  = tz.trashStock;
            zone.currentAgeMs       = tz.ageMs;
            zone.currentSeepAccumMs = tz.seepAccumMs;
            zone.currentIsSeeeping  = tz.isSeeeping;
            zone.refreshBar();
            zone.restoreSeepState();
            zone.onSeepStart = () => {
              this.showEvent("☠ Trash Seeping!", "An uncleaned trash zone is now draining a nearby fishing area!");
            };
            zone.onCleaned = () => {
              this.showEvent("Trash Cleaned! 🌊", "Pollution reduced and fish populations boosted.");
              this.trashZones = this.trashZones.filter(z => z !== zone);
              this.objectives.updateStats({ trashZonesCleaned: 1 });
              if (currentUsername) {
                logChoice(currentUsername, "cleaned_trash", { season: this.seasonManager.season });
              }
            };
                // Re register the full list so the boat can interact with the new zone.
            this.boat.registerTrashZones(this.trashZones);
          });
        }
      }
//This sets up the HUD/UI
      this.hud = new HUD(this);
      this.hud.registerFuel(this.boat.fuelSystem);
      
      // Restore the endangered catch counter and fish collection log from save.
      if (savedState && typeof savedState.endangeredCount === "number") {
        this.hud.endangeredCaught = savedState.endangeredCount;
      }
      if (savedState && Array.isArray(savedState.caughtCollection)) {
        this.hud.caughtCollection = savedState.caughtCollection;
      } 
      
      // If the player catches too many endangered fish, trigger an instant game over.
      //ONE OF OUR GAME OVERS
      this.hud.onEndangeredLimit = () => {
        this.hasGameEnded = true;
        if (currentUsername) saveGame(currentUsername, { gameOver: true, gameOverReason: "You caught too many endangered species!" });
        this.showGameOverScreen("You caught too many endangered species!");
      };
      //Pause Menu
      this.pauseMenu = new PauseMenu(this);
      this.hud.onMenuOpen = () => this.pauseMenu.open();
      this.pauseMenu.onResume = () => {};
      this.pauseMenu.onExitToMenu = () => { this.scene.restart(); }; //this will return player to main menu
      this.pauseMenu.getGameState = () => ({//snap shot of the game for save purposes
        money:          this.economy.getBalance(),
        season:         this.seasonManager.season,
        coralHealth:    this.ecosystem.getState().coralHealth,
        pollutionLevel: this.ecosystem.getState().pollutionLevel,
        acidityLevel:      this.ecosystem.getState().acidityLevel,
        biodiversityIndex: this.ecosystem.getState().biodiversityIndex,
        fuel:           this.boat.fuelSystem.fuel,
        boatX:          this.boat.x,
        boatY:          this.boat.y,
        fish:           this.boat.fish,
        zoneStocks:      this.fishingZones.map(z => z.currentStock),
        goneZones:      this.fishingZones.slice(0, 2).map(z => z.isGone),
        spawnedZones:   this.fishingZones.slice(2).filter(z => !z.isGone).map(z => ({
          x:     z.x,
          y:     z.y,
          size:  z.width,
          name:  z.zoneName,
          stock: z.currentStock,
        })),
        endangeredCount: this.hud.endangeredCaught,
        caughtCollection: this.hud.caughtCollection,
        trashZones: this.trashZones.filter(z => !z.isGone).map(z => z.saveState),
        upgradeLevels: this.boat.upgrades.getLevels(),
        fuelCost:        this.economy.getState().fuelCost,
        maintenanceCost: this.economy.getState().maintenanceCost,
        fishPopulations: this.ecosystem.getState().fishPopulations.map(f => ({
          name:             f.name,
          population:       f.population,
          caughtThisSeason: f.caughtThisSeason,
          regenerationRate: f.regenerationRate,
        })),
      });

      // Towing fee
      //Mechanic happens when player runs out of fuel
      this.boat.boatMovement.onFuelEmpty = () => {
        const TOWING_FEE = 300; //charging fee, can be changed later on
        this.economy.getState().balance       -= TOWING_FEE;
        this.economy.getState().totalExpenses += TOWING_FEE;
        const dock = this.marketZones[0];
        this.boat.setPosition(dock.x, dock.y + 100);//teleports to dock/marketzone
        this.showEvent("🚤 Towed to Dock",
          `You ran out of fuel and were towed back for $${TOWING_FEE}!`);
      };

      // Collection tracking
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

      // When the event system decides to spawn a trash zone, place it on the map. TRASH ZONE SPAWNER
      this.eventSystem.onSpawnTrash = (x, y) => { this.spawnTrashZone(x, y); };

      //Updates season objectives, achievements, and save when player sells a fish
      this.boat.onSell = (earned, count) => {
        AchievementManager.instance.updateStats({ lifetimeEarnings: earned });//achievement for selling fish
        this.objectives.updateStats({ moneyEarned: earned });
        this.hud.showSellFeedback(earned, count);

        if (currentUsername) {
          saveGame(currentUsername, {
            money:          this.economy.getBalance(),
            season:         this.seasonManager.season,
            coralHealth:    this.ecosystem.getState().coralHealth,
            pollutionLevel: this.ecosystem.getState().pollutionLevel,
            acidityLevel:      this.ecosystem.getState().acidityLevel,
            biodiversityIndex: this.ecosystem.getState().biodiversityIndex,
            fuel:           this.boat.fuelSystem.fuel,
            boatX:          this.boat.x,
            boatY:          this.boat.y,
            fish:           this.boat.fish,
            zoneStocks:      this.fishingZones.map(z => z.currentStock),
            goneZones:      this.fishingZones.slice(0, 2).map(z => z.isGone),
            spawnedZones:  this.fishingZones.slice(2).filter(z => !z.isGone).map(z => ({
              x:     z.x,
              y:     z.y,
              size:  z.width,
              name:  z.zoneName,
              stock: z.currentStock,
            })),
            endangeredCount: this.hud.endangeredCaught,
            caughtCollection: this.hud.caughtCollection,
            trashZones: this.trashZones.filter(z => !z.isGone).map(z => z.saveState),
            upgradeLevels: this.boat.upgrades.getLevels(),
            fuelCost:        this.economy.getState().fuelCost,
            maintenanceCost: this.economy.getState().maintenanceCost,
            fishPopulations: this.ecosystem.getState().fishPopulations.map(f => ({
              name:             f.name,
              population:       f.population,
              caughtThisSeason: f.caughtThisSeason,
              regenerationRate: f.regenerationRate,
            })),
          });
        }
      };

// It shows the season summary screen, deducts costs, handles bankruptcy,
// evaluates objectives, fires random events, and advances to the next season
      this.boat.onEndSeason = (earned, count) => {
        const econState = this.economy.getState();
        const season    = this.seasonManager.season;

        // Costs scale up each season to increase difficulty over time. Can change any time for balancing difficulty
        const scaledFuelCost        = econState.fuelCost + (season - 1) * 5;
        const scaledLicenseFee      = 20 + (season - 1) * 10;
        const scaledMaintenanceCost = econState.maintenanceCost + (season - 1) * 10;
        const totalCosts            = scaledFuelCost + scaledLicenseFee + scaledMaintenanceCost;

        const screen = new SeasonEndScreen(this);// Show the season summary screen with an earnings/expense breakdown.
        screen.show({
          earnings:        earned,
          fuelCost:        scaledFuelCost,
          licenseFee:      scaledLicenseFee,
          maintenanceCost: scaledMaintenanceCost,
          currentBalance:  econState.balance,
        });

        // This runs after the player clicks "Continue" on the summary screen.
        screen.onComplete = (canContinue) => {
          econState.balance += earned;
          econState.balance -= totalCosts;

          // If the player can't afford this season's costs, it's game over.
          //ONE GAME OVER OPTION
          if (econState.balance < 0) {
            AchievementManager.instance.updateStats({ gameOverCount: 1 });
            this.hasGameEnded = true;
            this.showGameOverScreen("You couldn't cover your seasonal costs!");
            if (currentUsername) {
              const ecoState = this.ecosystem.getState();
              const extinct  = ecoState.fishPopulations
                .filter(f => f.population <= 0).map(f => f.name as string);
              saveOutcome(currentUsername, "bankrupt",
                Math.floor(econState.balance), season,
                ecoState.coralHealth, ecoState.pollutionLevel, extinct);
                saveGame(currentUsername, { gameOver: true, gameOverReason: "You couldn't cover your seasonal costs!" });
            }
            this.scene.pause();
            return;
          }

          // Evaluate season objectives
          this.objectives.evaluateSeason(canContinue);

          AchievementManager.instance.updateStats({ seasonsCompleted: 1 });

          // If the player was in debt before earnings arrived, reward recovery. not tested yet
          if (econState.balance - earned + totalCosts < 0) {
            AchievementManager.instance.updateStats({ recoveredFromNegative: true });
          }

          this.hud.showSellFeedback(earned, count);

          const event = this.eventSystem.triggerRandomEvent();
          if (event) this.showEvent(event.title, event.description);
          const crisis = this.eventSystem.checkLowPopulationEvent();
          if (crisis) this.showEvent(crisis.title, crisis.description);

          // Move the season counter forward and give the player a free refuel.
          this.seasonManager.advanceSeason();
          this.boat.fuelSystem.refuelFree();

          // Spawn one new fishing zone every 2 seasons
          const nextSeason = season + 1;
          if (nextSeason % 2 === 0) {
            this.spawnFishingZone();
          }

          // Trash zones accumulate over time — cap extra spawns at 3 per season.
          const extraTrash = Math.min(Math.floor(this.seasonManager.season / 2), 3);
          for (let t = 0; t < extraTrash; t++) {
            const tx = Phaser.Math.Between(80, this.cameras.main.width  - 80);
            const ty = Phaser.Math.Between(80, this.cameras.main.height - 150);
            this.spawnTrashZone(tx, ty);
          }
          AchievementManager.instance.updateStats({
            totalTrashZones: 3 + this.trashZones.length,
          });
          
          // Auto-save after the season transition and log the completion event.
          if (currentUsername) {
            saveGame(currentUsername, {
              money:          this.economy.getBalance(),
              season:         this.seasonManager.season,
              coralHealth:    this.ecosystem.getState().coralHealth,
              pollutionLevel: this.ecosystem.getState().pollutionLevel,
              acidityLevel:      this.ecosystem.getState().acidityLevel,
              biodiversityIndex: this.ecosystem.getState().biodiversityIndex,
              fuel:           this.boat.fuelSystem.fuel,
              boatX:          this.boat.x,
              boatY:          this.boat.y,
              fish:           this.boat.fish,
              zoneStocks:      this.fishingZones.map(z => z.currentStock),
              goneZones:      this.fishingZones.slice(0, 2).map(z => z.isGone),
              spawnedZones:  this.fishingZones.slice(2).filter(z => !z.isGone).map(z => ({
                x:     z.x,
                y:     z.y,
                size:  z.width,
                name:  z.zoneName,
                stock: z.currentStock,
              })),
              endangeredCount: this.hud.endangeredCaught,
              caughtCollection: this.hud.caughtCollection,
              trashZones: this.trashZones.filter(z => !z.isGone).map(z => z.saveState),
              upgradeLevels: this.boat.upgrades.getLevels(),
              fuelCost:        this.economy.getState().fuelCost,
              maintenanceCost: this.economy.getState().maintenanceCost,
              fishPopulations: this.ecosystem.getState().fishPopulations.map(f => ({
                name:             f.name,
                population:       f.population,
                caughtThisSeason: f.caughtThisSeason,
                regenerationRate: f.regenerationRate,
              })),
            });
            logChoice(currentUsername, "season_completed", {
              season:  this.seasonManager.season,
              balance: econState.balance,
            });
          }

          // Start next season objectives + show popup
          this.objectives.startSeason(nextSeason);
          const popup = new SeasonObjectivePopup(this);
          popup.onClose = () => {};
          popup.show(this.objectives, nextSeason);
        };
      };

      this.seasonManager.onSeasonChange = (season, seasonName) => {
        this.hud.showSeasonBanner(season, seasonName);
      };

      const startSeason = savedState?.season ?? 1;
      this.objectives.startSeason(startSeason);

      // Only show the intro popup for new games, skip it when loading a save
      if (savedState) {
        if (savedState.gameOver) {
          this.showGameOverScreen(savedState.gameOverReason);
          return;
        }
        this.sceneReady = true;
      } else {
        const introPopup = new SeasonObjectivePopup(this);
        introPopup.onClose = () => { this.sceneReady = true; };
        introPopup.show(this.objectives, startSeason);
      }
    });
  }

  private getSeasonName(season: number): string {
    const SEASON_NAMES = ["Spring", "Summer", "Autumn", "Winter"];
    return SEASON_NAMES[(season - 1) % SEASON_NAMES.length];
  }

  // Spawns a new fishing zone in a spread-out position, avoiding existing zones. //
  private spawnFishingZone() {
    const MAX_ZONES = 5; // This sets the maximum amount of fishing zones.
    if (this.fishingZones.filter(z => !z.isGone).length >= MAX_ZONES) return;

    const ZONE_NAMES = [
      "Coral Bed", "Kelp Forest", "Rocky Shoals", "Open Sea",
      "Tidal Flats", "Sunken Shelf", "Warm Current", "Northern Banks",
    ];
    const MIN_DIST = 250;
    const MARGIN   = 100;
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    let x = 0, y = 0, attempts = 0;
    do {
      x = Phaser.Math.Between(MARGIN, W - MARGIN);
      y = Phaser.Math.Between(MARGIN, H - MARGIN - 50);
      attempts++;
    } while (
      attempts < 30 &&
      this.fishingZones.filter(z => !z.isGone).some(z => {
        const dx = z.x - x, dy = z.y - y;
        return Math.sqrt(dx * dx + dy * dy) < MIN_DIST;
      })
    );

    const name = ZONE_NAMES[Phaser.Math.Between(0, ZONE_NAMES.length - 1)];
    const size = Phaser.Math.Between(100, 140);
    const zone = new FishingZone(this, x, y, size, size, name);
    this.fishingZones.push(zone);
    this.boat.registerZones(this.fishingZones);
    this.seasonManager.registerZones(this.fishingZones);

    this.showEvent("🐟 New Fishing Zone!", `A new area has appeared: ${name}`);
  }

  private spawnTrashZone(x: number, y: number) {
    const zone = new TrashZone(this, x, y, 100, 100, this.ecosystem);
    this.trashZones.push(zone);

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
          saveGame(currentUsername, { gameOver: true, gameOverReason: "The ecosystem has collapsed." });
      }
      this.showGameOverScreen("Game Over, The ecosystem has collapsed.");
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
    }).setOrigin(0.5, 0).setDepth(50);

    this.activeEventTexts.push(text);

    this.tweens.add({
      targets: text, alpha: 0, duration: 16000, ease: "Power2",
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

  showGameOverScreen(reason?: string) {
    this.hasGameEnded = true;

    this.physics.pause();
    this.boat.setActive(false);
    this.boat.setVisible(false);

    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    const econ = this.economy.getState();
    const eco  = this.ecosystem.getState();

    this.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.9)
      .setDepth(1000);

    this.add.text(cx, cy - 220, "GAME OVER", {
      fontSize: "56px",
      fontStyle: "bold",
      color: "#ff4444",
      fontFamily: "monospace",
      stroke: "#000",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(1001);

    if (reason) {
      this.add.text(cx, cy - 160, reason, {
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffbb44",
        fontFamily: "monospace",
        stroke: "#000",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(1001);
    }

    const stats = [
      `Final Balance: $${econ.balance}`,
      `Seasons Survived: ${this.seasonManager.season}`,
      `Coral Health: ${Math.floor(eco.coralHealth)}%`,
      `Pollution Level: ${Math.floor(eco.pollutionLevel)}%`,
    ];
    stats.forEach((line, i) => {
      this.add.text(cx, cy - 80 + i * 40, line, {
        fontSize: "22px",
        color: "#ffeeaa",
        fontFamily: "monospace",
        stroke: "#000",
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(1001);
    });

    const menu = this.add.text(cx, cy + 210, "Main Menu", {
      fontSize: "26px",
      color: "#ffaa44",
      fontFamily: "monospace",
      backgroundColor: "#0a2a3a",
      padding: { x: 30, y: 12 },
    })
    .setOrigin(0.5)
    .setDepth(1001)
    .setInteractive({ useHandCursor: true });

    menu.on("pointerdown", async () => {
      this.hasGameEnded = false;
      if (currentUsername) {
        await saveGame(currentUsername, {});
      }
      window.location.reload();
    });
  }
}