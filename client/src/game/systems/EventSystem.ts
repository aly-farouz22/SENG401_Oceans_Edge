import Phaser from "phaser";
import { EconomySystem } from "./EconomySystem";
import { EcosystemSystem } from "./EcosystemSystem";

export interface EventResult {
    title: string;
    description: string;
}

export class EventSystem {
    private economy: EconomySystem;
    private ecosystem: EcosystemSystem;

    public onSpawnTrash?: (x: number, y: number) => void;

    constructor(economy: EconomySystem, ecosystem: EcosystemSystem) {
        this.economy = economy;
        this.ecosystem = ecosystem;
    }public triggerRandomEvent(): EventResult | null {
    const roll = Math.random();
    let result: EventResult | null = null;


        if (roll < 0.50) { 
            result = null;
        } else if (roll < 0.60) {
            this.ecosystem.addPollution(10);
            this.onSpawnTrash?.(
                Phaser.Math.Between(100, 800),
                Phaser.Math.Between(100, 500)
            );
            result = { title: "Oil Spill ", description: "Pollution increased and trash appeared in the water!" };
        } else if (roll < 0.75) {
            this.ecosystem.cleanPollution(8);
            result = { title: "Community Cleanup ", description: "Pollution decreased by 8." };
        } else if (roll < 0.90) {
            this.economy.getState().fuelCost += 5;
            result = { title: "Fuel Price Increase ", description: "Fuel cost increased by 5." };
        } else if (roll < 0.95) {
            this.economy.getState().maintenanceCost += 5;
            result = { title: "Boat Wear and Tear ", description: "Maintenance cost increased by 5." };
        } else if (roll < 0.975) {
            this.ecosystem.addPollution(15);
            this.onSpawnTrash?.(
                Phaser.Math.Between(100, 800),
                Phaser.Math.Between(100, 500)
            );
            this.economy.getState().maintenanceCost += 10;
            result = { title: "Weather Damage ", description: "Pollution increased, trash appeared, and maintenance cost increased by 10." };
        } else {
            this.economy.addRevenue(20);
            result = { title: "Fishing Festival ", description: "A local festival boosts your revenue by 20." };
        }

        return result;
    }

    public checkLowPopulationEvent(): EventResult | null {
        const ecosystemState = this.ecosystem.getState();

        const POPULATION_THRESHOLD = 50;

        const lowFish = ecosystemState.fishPopulations.find(
            fish => fish.population <= POPULATION_THRESHOLD
        );

        if (!lowFish) return null;


        lowFish.regeneartionRate = Math.max(lowFish.regeneartionRate - 0.01, 0);

        ecosystemState.coralHealth = Math.max(ecosystemState.coralHealth - 10, 0);

        console.log("CRISIS TRIGGERED:", lowFish.name, "Population:", lowFish.population);

        return {
            title: "Fish Population Crisis ",
            description: `${lowFish.name} population is critically low. Coral health decreased, regeneration slowed, and more species are now endangered.`
        };
    }
}
