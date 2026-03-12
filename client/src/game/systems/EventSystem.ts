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
    public triggerRandomEvent(): EventResult {
        //roll from 0 to 3 for 4 possible events, change if more events are added later
        const roll = Math.floor(Math.random() * 4);
        let result: EventResult;
        // Event effects are subject to change based on balance testing
        switch (roll) {
            case 0:
                this.ecosystem.addPollution(10);
                result = {
                    title: "Oil Spill",
                    description: "Pollution increased by 10."
                };
                break;

            case 1:
                this.ecosystem.cleanPollution(8);
                result = {
                    title: "Community Cleanup",
                    description: "Pollution decreased by 8."
                };
                break;

            case 2:
                this.economy.getState().fuelCost += 5;
                result = {
                    title: "Fuel Price Increase",
                    description: "Fuel cost increased by 5."
                };
                break;

            default:
                this.economy.getState().maintenanceCost += 5;
                result = {
                    title: "Boat Wear and Tear",
                    description: "Maintenance cost increased by 5."
                };
                break;
        }

        return result;
    }


    // trigger when fish population gets too low
public checkLowPopulationEvent(): EventResult | null {
    const ecosystemState = this.ecosystem.getState();
    const fishPopulations = ecosystemState.fishPopulations;

    const lowFish = fishPopulations.find(fish => fish.population <= 50);

    if (!lowFish) {
        return null;
    }
}
}
