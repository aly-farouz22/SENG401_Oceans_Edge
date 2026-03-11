export interface FishPrice {
    name: string;
    value: number;
}

export interface EconomyState {
    balance: number;
    totalEarnings: number;
    totalExpenses: number;
    lastTripEarnings: number;
    fuelCost: number;
    maintenanceCost: number;
    seasonalUpkeepCost: number;
    betterNetsPurchased: boolean;
    efficientEnginePurchased: boolean;
    storageUpgradePurchased: boolean;
    fishPrices: FishPrice[];
}

export class EconomySystem {
    private state: EconomyState;

    constructor() {
        this.state = {
            balance: 0,
            totalEarnings: 0,
            totalExpenses: 0,
            lastTripEarnings: 0,

            // Basic trip and seasonal costs
            fuelCost: 20,
            maintenanceCost: 10,
            seasonalUpkeepCost: 100,

            // Upgrade tracking
            betterNetsPurchased: false,
            efficientEnginePurchased: false,
            storageUpgradePurchased: false,

            // Fixed species based fish prices
            fishPrices: [
                { name: "Salmon", value: 10 },
                { name: "Tuna", value: 20 },
                { name: "Bluefin", value: 50 },
            ],
        };
    }

    // This method gets the current economy state
    public getState(): EconomyState {
        return this.state;
    }

    // This method returns the player's current balance
    public getBalance(): number {
        return this.state.balance;
    }

    // This method calculates the value of a fishing haul
    public calculateHaulValue(fishName: string, amount: number): number {
        const fish = this.state.fishPrices.find(f => f.name === fishName);
        if (!fish || amount <= 0) return 0;

        let totalValue = fish.value * amount;

        // Better nets increase fishing revenue by 20%
        if (this.state.betterNetsPurchased) {
            totalValue *= 1.2;
        }

        return totalValue;
    }

    // This method adds fishing revenue to the player's balance
    public addRevenue(amount: number): void {
        if (amount <= 0) return;

        this.state.balance += amount;
        this.state.totalEarnings += amount;
        this.state.lastTripEarnings = amount;
    }

    // This method calculates revenue from one fishing trip
    public processFishingTrip(catches: { fishName: string; amount: number }[]): number {
        let tripRevenue = 0;

        catches.forEach(catchItem => {
            tripRevenue += this.calculateHaulValue(catchItem.fishName, catchItem.amount);
        });

        this.addRevenue(tripRevenue);
        return tripRevenue;
    }

    // This method deducts boating costs after a fishing trip
    public deductTripCost(): boolean {
        let totalTripCost = this.state.fuelCost + this.state.maintenanceCost;

        // Efficient engine reduces fuel cost by 25%
        if (this.state.efficientEnginePurchased) {
            totalTripCost -= this.state.fuelCost * 0.25;
        }

        if (this.state.balance < totalTripCost) {
            return false;
        }

        this.state.balance -= totalTripCost;
        this.state.totalExpenses += totalTripCost;
        return true;
    }

    // This method deducts the seasonal upkeep cost
    public deductSeasonCost(): boolean {
        const seasonCost = this.state.seasonalUpkeepCost;

        if (this.state.balance < seasonCost) {
            return false;
        }

        this.state.balance -= seasonCost;
        this.state.totalExpenses += seasonCost;
        return true;
    }

    // This method checks if the player can afford a cost
    public canAfford(cost: number): boolean {
        return this.state.balance >= cost;
    }

    // This method purchases the Better Nets upgrade
    public buyBetterNets(): boolean {
        const cost = 100;

        if (this.state.betterNetsPurchased || !this.canAfford(cost)) {
            return false;
        }

        this.state.balance -= cost;
        this.state.totalExpenses += cost;
        this.state.betterNetsPurchased = true;
        return true;
    }

    // This method purchases the Efficient Engine upgrade
    public buyEfficientEngine(): boolean {
        const cost = 150;

        if (this.state.efficientEnginePurchased || !this.canAfford(cost)) {
            return false;
        }

        this.state.balance -= cost;
        this.state.totalExpenses += cost;
        this.state.efficientEnginePurchased = true;
        return true;
    }

    // This method purchases the Storage Upgrade
    public buyStorageUpgrade(): boolean {
        const cost = 120;

        if (this.state.storageUpgradePurchased || !this.canAfford(cost)) {
            return false;
        }

        this.state.balance -= cost;
        this.state.totalExpenses += cost;
        this.state.storageUpgradePurchased = true;
        return true;
    }

    // This method is called every season to update the economy
    public updateSeason(): boolean {
        return this.deductSeasonCost();
    }
}