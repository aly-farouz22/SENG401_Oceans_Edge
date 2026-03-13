import Phaser from "phaser";
import FishingZone from "../FishingZone";
import MarketZone from "../MarketZone";
import BoatFishing from "./BoatFishing";
import BoatInventory from "./BoatInventory";
import BoatMovement from "./BoatMovement";
import { EcosystemSystem, FishSpecies } from "../../systems/EcosystemSystem";
import BoatUpgrade from "./BoatUpgrade";

export default class Boat extends Phaser.Physics.Arcade.Sprite {
  private movement:  BoatMovement;
  private fishing:   BoatFishing;
  readonly inventory: BoatInventory;
  private ecosystem: EcosystemSystem;

  get money() { return this.inventory.money; }
  get fish()  { return this.inventory.fish;  }

  set onSell(cb: (earned: number, count: number) => void) {
    this.inventory.onSell = cb;
  }

  set onEndSeason(cb: (earned: number, count: number) => void) {
    this.inventory.onEndSeason = cb;
  }

  // Each zone gets its own overlap counter so we know WHICH zone is active
  private zoneOverlaps: Map<FishingZone, number> = new Map();
  private marketOverlaps = 0;

  readonly upgrades: BoatUpgrade;
  constructor(scene: Phaser.Scene, x: number, y: number, ecosystem: EcosystemSystem) {
    super(scene, x, y, "boat");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.ecosystem = ecosystem;
    this.movement  = new BoatMovement(scene, this);
    this.fishing   = new BoatFishing(scene, this);
    this.inventory = new BoatInventory(scene, this);
    this.upgrades = new BoatUpgrade(this);

    this.fishing.onCatch = (fish) => {
      this.inventory.addFish(fish);
      const amountCaught = fish.amount;
      const ecosystemFish: FishSpecies | undefined = this.ecosystem.getState().fishPopulations.find(
        f => f.name === fish.name
      );
      if (ecosystemFish) {
        this.ecosystem.harvestFish(fish.name, amountCaught);
        if (fish.isJuvenile) {
          ecosystemFish.regeneartionRate *= 0.9;
          console.log('Caught Juvenile ${fish.name}: Regeneration Reduced!')
        }
        if (fish.endangered) {
          ecosystemFish.population -= amountCaught * 0.5;
          console.log('Caught Endangered ${fish.name}: Extra Population Loss!')
        }
      }
    }
  }

  registerZones(zones: FishingZone[]) {
    this.fishing.registerZones(zones);
    zones.forEach(zone => {
      this.zoneOverlaps.set(zone, 0);
      this.scene.physics.add.overlap(this, zone, () => {
        this.zoneOverlaps.set(zone, (this.zoneOverlaps.get(zone) ?? 0) + 1);
      });
    });
  }

  registerMarketZones(zones: MarketZone[]) {
    this.inventory.registerMarketZones(zones);
    zones.forEach(zone => {
      this.scene.physics.add.overlap(this, zone, () => { this.marketOverlaps++; });
    });
  }

  update() {
    // Find which zone the boat is currently inside (first match wins)
    let activeZone: FishingZone | null = null;
    for (const [zone, count] of this.zoneOverlaps.entries()) {
      if (count > 0) { activeZone = zone; break; }
    }

    const isAtMarket = this.marketOverlaps > 0;

    // Reset counters for next frame
    for (const zone of this.zoneOverlaps.keys()) this.zoneOverlaps.set(zone, 0);
    this.marketOverlaps = 0;

    this.movement.update(this.fishing.isFishing);
    this.fishing.update(activeZone, isAtMarket);
    this.inventory.update(isAtMarket);
  }
}