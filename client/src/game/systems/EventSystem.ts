import Phaser from "phaser";
import { EconomySystem } from "./EconomySystem";
import { EcosystemSystem } from "./EcosystemSystem";

export interface EventResult {
  title: string;
  description: string;
}
// EventSystem fires random world events at the end of each season and
// checks for ongoing ecological crises
export class EventSystem {
  private economy: EconomySystem;
  private ecosystem: EcosystemSystem;

  public onSpawnTrash?: (x: number, y: number) => void;

  constructor(economy: EconomySystem, ecosystem: EcosystemSystem) {
    this.economy = economy;
    this.ecosystem = ecosystem;
  }
// Rolls a random number and fires one of six possible events
// Called by MainScene once per season after the summary screen is dismissed.
  public triggerRandomEvent(): EventResult | null {
    const roll = Math.random();
    let result: EventResult | null = null;

    if (roll < 0.5) {
      result = null;
    } else if (roll < 0.6) {
      this.ecosystem.addPollution(10);
      this.onSpawnTrash?.(
        Phaser.Math.Between(100, 800),
        Phaser.Math.Between(100, 500)
      );
      result = {
        title: "Oil Spill",
        description: "Pollution increased and trash appeared in the water!",
      };
    } else if (roll < 0.75) {
      this.ecosystem.cleanPollution(8);
      result = {
        title: "Community Cleanup",
        description: "Pollution decreased by 8.",
      };
    } else if (roll < 0.9) {
      this.economy.getState().fuelCost += 5;
      result = {
        title: "Fuel Price Increase",
        description: "Fuel cost increased by 5.",
      };
    } else if (roll < 0.95) {
      this.economy.getState().maintenanceCost += 5;
      result = {
        title: "Boat Wear and Tear",
        description: "Maintenance cost increased by 5.",
      };
    } else if (roll < 0.975) {
      this.ecosystem.addPollution(15);
      this.onSpawnTrash?.(
        Phaser.Math.Between(100, 800),
        Phaser.Math.Between(100, 500)
      );
      this.economy.getState().maintenanceCost += 10;
      result = {
        title: "Weather Damage",
        description: "Pollution increased, trash appeared, and maintenance cost increased by 10.",
      };
    } else {
      this.economy.addRevenue(20);
      result = {
        title: "Fishing Festival",
        description: "A local festival boosts your revenue by 20.",
      };
    }

    return result;
  }
  //If a species is found below the threshold (population < 50):
  //Its regeneration rate is permanently reduced by 0.01
  public checkLowPopulationEvent(): EventResult | null {
    const POPULATION_THRESHOLD = 50;// Species below this are considered at-risk

    const lowFish = this.ecosystem.getLowPopulationSpecies(POPULATION_THRESHOLD);

    if (!lowFish) return null;

    // Slow the struggling species' recovery. Also damages environment
    this.ecosystem.changeSpeciesRegeneration(lowFish.name, -0.01);
    this.ecosystem.damageCoral(10);

    return {
      title: "Fish Population Crisis",
      description: `${lowFish.name} population is critically low. Coral health decreased and regeneration slowed.`,
    };
  }
}