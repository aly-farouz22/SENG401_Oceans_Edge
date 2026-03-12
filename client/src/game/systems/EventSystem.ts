import { EconomySystem } from "./EconomySystem";
import { EcosystemSystem } from "./EcosystemSystem";

export interface EventResult {
    title: string;
    description: string;
}

export class EventSystem {
    private economy: EconomySystem;
    private ecosystem: EcosystemSystem;
    private lastEvent: EventResult | null = null;

    constructor(economy: EconomySystem, ecosystem: EcosystemSystem) {
        this.economy = economy;
        this.ecosystem = ecosystem;
    }



    public triggerRandomEvent(): EventResult {
        const roll = Math.floor(Math.random() * 4);
        let result: EventResult;

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
}