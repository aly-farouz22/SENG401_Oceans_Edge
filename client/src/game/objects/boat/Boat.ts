import Phaser from "phaser";
import { EconomySystem } from "../../systems/EconomySystem";
import { EcosystemSystem, FishSpecies } from "../../systems/EcosystemSystem";
import FishingZone from "../FishingZone";
import MarketZone from "../MarketZone";
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

  get money()   { return this._m.inventory.money; }
  get fish()    { return this._m.inventory.fish;  }
  get upgrades(){ return this._m.upgrades; }
  get economy() { return this._m.economy; }
  get fishing() { return this._m.fishing; }
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

  private zoneOverlaps: Map<FishingZone, number> = new Map();
  private marketOverlaps = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, ecosystem: EcosystemSystem, economy?: EconomySystem) {
    super(scene, x, y, "boat");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(1); // adjust scale to fit your game world

    const eco = economy ?? new EconomySystem();

    const movement  = new BoatMovement(scene, this);
    const fishing   = new BoatFishing(scene, this);
    const inventory = new BoatInventory(scene, this, eco);
    const upgrades  = new BoatUpgrade(this);

    this._m = { movement, fishing, inventory, upgrades, economy: eco, ecosystem };

    fishing.onCatch = (fish) => {
      inventory.addFish(fish);
      const ecosystemFish: FishSpecies | undefined = ecosystem.getState().fishPopulations.find(
        f => f.name === fish.name
      );
      if (ecosystemFish) {
        ecosystem.harvestFish(fish.name, fish.amount ?? 1);
        if (fish.isJuvenile) ecosystemFish.regeneartionRate *= 0.9;
        if (fish.endangered) ecosystemFish.population -= (fish.amount ?? 1) * 0.5;
      }
    };
  }

  registerZones(zones: FishingZone[]) {
    this._m.fishing.registerZones(zones);
    zones.forEach(zone => {
      this.zoneOverlaps.set(zone, 0);
      this.scene.physics.add.overlap(this, zone, () => {
        this.zoneOverlaps.set(zone, (this.zoneOverlaps.get(zone) ?? 0) + 1);
      });
    });
  }

  registerMarketZones(zones: MarketZone[]) {
    this._m.inventory.registerMarketZones(zones);
    zones.forEach(zone => {
      this.scene.physics.add.overlap(this, zone, () => { this.marketOverlaps++; });
    });
  }

  tick() {
    let activeZone: FishingZone | null = null;
    for (const [zone, count] of this.zoneOverlaps.entries()) {
      if (count > 0) { activeZone = zone; break; }
    }

    const isAtMarket = this.marketOverlaps > 0;

    for (const zone of this.zoneOverlaps.keys()) this.zoneOverlaps.set(zone, 0);
    this.marketOverlaps = 0;

    this._m.movement.update(this._m.fishing.isFishing);
    this._m.fishing.update(activeZone, isAtMarket);
    this._m.inventory.update(isAtMarket);
  }
}