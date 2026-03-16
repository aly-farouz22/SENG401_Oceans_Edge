import { EconomySystem } from "./EconomySystem";
import { EcosystemSystem } from "./EcosystemSystem";

export interface EventResult {
    title: string;
    description: string;
}

export class EventSystem {
    private economy: EconomySystem;
    private ecosystem: EcosystemSystem;

    constructor(economy: EconomySystem, ecosystem: EcosystemSystem) {
        this.economy = economy;
        this.ecosystem = ecosystem;
    }


// randomly trigger any event
public triggerRandomEvent(): EventResult | null {
    const roll = Math.random();
    let result: EventResult | null = null;

    if (roll < 0.65) {
        // 65% chance nothing happens
        result = null;
    } else if (roll < 0.77) {
        this.ecosystem.addPollution(10);
        result = { title: "Oil Spill", description: "Pollution increased by 10." };
    } else if (roll < 0.87) {
        this.ecosystem.cleanPollution(8);
        result = { title: "Community Cleanup", description: "Pollution decreased by 8." };
    } else if (roll < 0.93) {
        this.economy.getState().fuelCost += 5;
        result = { title: "Fuel Price Increase", description: "Fuel cost increased by 5." };
    } else if (roll < 0.97) {
        this.economy.getState().maintenanceCost += 5;
        result = { title: "Boat Wear and Tear", description: "Maintenance cost increased by 5." };
    } else if (roll < 0.985) {
        this.ecosystem.addPollution(15);
        this.economy.getState().maintenanceCost += 10;
        result = { title: "Weather Damage", description: "Pollution increased and boat maintenance cost increased by 10." };
    } else {
        this.economy.addRevenue(20);
        result = { title: "Fishing Festival", description: "A local festival boosts your revenue by 20." };
    }

    return result;
}

    // trigger when fish population gets too low
    public checkLowPopulationEvent(): EventResult | null {
        const ecosystemState = this.ecosystem.getState();
        const fishPopulations = ecosystemState.fishPopulations;

        const lowFish = fishPopulations.find(fish => fish.population <= 75);

        if (!lowFish) {
            return null;
        }
        // Make the critically low species endangered and regenerate slower
        lowFish.endangered = true;
        lowFish.regeneartionRate -= 0.01;

        if (lowFish.regeneartionRate < 0) {
        lowFish.regeneartionRate = 0;
        }

        ecosystemState.coralHealth -= 10;
        if (ecosystemState.coralHealth < 0) {
            ecosystemState.coralHealth = 0;
        }


            return {
            title: "Fish Population Crisis",
            description: `${lowFish.name} population is critically low. Coral health decreased, regeneration slowed, and more species are now endangered.`
        };
    }


}
