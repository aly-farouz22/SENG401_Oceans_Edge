import Phaser from "phaser";
import { logChoice } from "../../../services/api";
import { currentUsername } from "../../scenes/BootScene";
import { EconomySystem } from "../../systems/EconomySystem";
import { EcosystemSystem, FishSpecies } from "../../systems/EcosystemSystem";
import { FuelSystem } from "../../systems/FuelSystem";
import FishingZone from "../FishingZone";
import MarketZone from "../MarketZone";
import TrashZone from "../TrashZone";
import BoatFishing from "./BoatFishing";
import BoatInventory from "./BoatInventory";
import BoatMovement from "./BoatMovement";
import BoatUpgrade from "./BoatUpgrade";

interface BoatModules {
  movement:  BoatMovement;
  fishing:   BoatFishing;
  inventory: BoatInventory;
  upgrades:  BoatUpgrade;
  economy:   EconomySystem;
  ecosystem: EcosystemSystem;
}

export default class Boat extends Phaser.Physics.Arcade.Sprite {
  private _m!: BoatModules;

  public fuelSystem!: FuelSystem;

  /** Set from MainScene so objective tracking fires on endangered catches */
  public onEndangeredCatch?: () => void;

  get money()        { return this._m.inventory.money; }
  get fish()         { return this._m.inventory.fish; }
  get upgrades()     { return this._m.upgrades; }
  get economy()      { return this._m.economy; }
  get fishing()      { return this._m.fishing; }
  get boatMovement() { return this._m.movement; }

  set onSell(cb: (earned: number, count: number) => void) {
    this._m.inventory.onSell = cb;
  }
  set onEndSeason(cb: (earned: number, count: number) => void) {
    this._m.inventory.onEndSeason = cb;
  }
  set onUpgrade(cb: () => void) {
    this._m.inventory.onUpgrade = cb;
  }

  private zoneOverlaps:      Map<FishingZone, number> = new Map();
  private trashZoneOverlaps: Map<TrashZone, number>   = new Map();
  private marketOverlaps = 0;

  constructor(
    scene:     Phaser.Scene,
    x:         number,
    y:         number,
    ecosystem: EcosystemSystem,
    economy?:  EconomySystem
  ) {
    super(scene, x, y, "boat");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(1).setDepth(20);

    const eco       = economy ?? new EconomySystem();
    const movement  = new BoatMovement(scene, this);
    const fishing   = new BoatFishing(scene, this);
    const inventory = new BoatInventory(scene, this, eco);
    const upgrades  = new BoatUpgrade(this);

    this._m = { movement, fishing, inventory, upgrades, economy: eco, ecosystem };
    inventory.registerUpgrades(upgrades);
    fishing.isInventoryFull = () => inventory.isFull;

    // ── Fuel system ──────────────────────────────────────────────────────────
    this.fuelSystem     = new FuelSystem();
    movement.fuelSystem = this.fuelSystem;

    fishing.onCatch = (fish) => {
      inventory.addFish(fish);

      const ecosystemFish: FishSpecies | undefined =
        ecosystem.getState().fishPopulations.find(
          (f) => f.name === (fish.ecosystemName ?? fish.name)
        );

      if (!ecosystemFish) return;

      const amount = fish.amount ?? 1;
      ecosystem.harvestFish(fish.ecosystemName ?? fish.name, amount);

      if (fish.isJuvenile && !fish.invasive) {
        ecosystemFish.regenerationRate *= 0.9;
      }

      // ── Objective tracking ────────────────────────────────────────────────
      if (fish.endangered) {
        this.onEndangeredCatch?.();

        if (currentUsername) {
          logChoice(currentUsername, "caught_endangered", {
            fishName: fish.name,
            season:   undefined,
          });
        }
      }

      if (fish.invasive && currentUsername) {
        logChoice(currentUsername, "caught_invasive", { fishName: fish.name });
      }
    };
  }

  registerTrashZones(zones: TrashZone[]) {
    this._m.fishing.registerTrashZones(zones);
    this.trashZoneOverlaps.clear();
    zones.forEach((zone) => {
      this.trashZoneOverlaps.set(zone, 0);
      this.scene.physics.add.overlap(this, zone, () => {
        this.trashZoneOverlaps.set(zone, (this.trashZoneOverlaps.get(zone) ?? 0) + 1);
      });
    });
  }

  registerZones(zones: FishingZone[]) {
    this._m.fishing.registerZones(zones);
    zones.forEach((zone) => {
      this.zoneOverlaps.set(zone, 0);
      this.scene.physics.add.overlap(this, zone, () => {
        this.zoneOverlaps.set(zone, (this.zoneOverlaps.get(zone) ?? 0) + 1);
      });
    });
  }

  registerMarketZones(zones: MarketZone[]) {
    this._m.inventory.registerMarketZones(zones);
    zones.forEach((zone) => {
      this.scene.physics.add.overlap(this, zone, () => { this.marketOverlaps++; });
    });
  }

  tick(delta = 16) {
    let activeZone: FishingZone | null = null;
    for (const [zone, count] of this.zoneOverlaps.entries()) {
      if (count > 0) { activeZone = zone; break; }
    }

    let activeTrashZone: TrashZone | null = null;
    for (const [zone, count] of this.trashZoneOverlaps.entries()) {
      if (count > 0 && !zone.isGone) { activeTrashZone = zone; break; }
    }

    const isAtMarket = this.marketOverlaps > 0;

    for (const zone of this.zoneOverlaps.keys())      this.zoneOverlaps.set(zone, 0);
    for (const zone of this.trashZoneOverlaps.keys()) this.trashZoneOverlaps.set(zone, 0);
    this.marketOverlaps = 0;

    this._m.movement.update(this._m.fishing.isFishing, delta);
    this._m.fishing.update(activeZone, activeTrashZone, isAtMarket);
    this._m.inventory.update(isAtMarket);
  }
}