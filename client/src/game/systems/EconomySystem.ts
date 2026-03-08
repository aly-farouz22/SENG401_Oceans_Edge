export interface FishSpecies {
    name: String;
    population: number;
    regeneartionRate: number;
    endangered: boolean;
}

export interface EcosystemState {
    fishPopulations: FishSpecies[];
    coralHealth: number; // 0-100
    pollutionLevel: number; // 0-100
    acidityLevel: number; // 0-14
}

export class EcosystemSystem {
    private state: EcosystemState;
    constructor() {
        this.state = {
            fishPopulations: [
                {name: "Salmon", population: 1000, regeneartionRate: 0.1, endangered: false},
                {name: "Tuna", population: 400, regeneartionRate: 0.05, endangered: false},
                {name: "Bluefin", population: 60, regeneartionRate: 0.02, endangered: true},
            ],
            coralHealth: 100,
            pollutionLevel: 0,
            acidityLevel: 7,
        }
    }
    // This method gets the current ecosytem state
    public getState(): EcosystemState {
        return this.state;
    }
    // This method is called every season to update the ecosystem
    public updateSeason(): void {
        this.regenerateFish();
        this.updateCoralHealth();
        this.updateAcidity();
    }
    // This method regeneartes fish populations based on the regenerationRate specified for each species
    private regenerateFish(): void {
        this.state.fishPopulations.forEach(fish => {
            const growth = fish.population * fish.regeneartionRate;
            fish.population += growth;
        });
    }
    // This method reduces the coralHealth if pollution level is high
    private updateCoralHealth(): void {
        const pollutionFactor = this.state.pollutionLevel * 0.05;
        this.state.coralHealth -= pollutionFactor;
        if (this.state.coralHealth < 0) this.state.coralHealth = 0;
    }
    // This method increases the acidity Level if pollution level is high
    private updateAcidity(): void {
        const pollutionImpact = this.state.pollutionLevel * 0.01;
        this.state.acidityLevel += pollutionImpact;
        if (this.state.acidityLevel > 14) this.state.acidityLevel = 14;
    }
    // This method reduces fish population when the player catches fish
    public harvestFish(fishName: string, amount: number): void {
        const fish = this.state.fishPopulations.find(f => f.name === fishName);
        if (!fish) return;
        fish.population -= amount;
        if (fish.population < 0) fish.population = 0;
    }
    // This method increases pollution as a result of player's actions
    public addPollution(amount: number): void {
        this.state.pollutionLevel += amount;
        if (this.state.pollutionLevel > 100) this.state.pollutionLevel = 100;
    }
    // This method decreases pollution as a result of player's actions
    public cleanPollution(amount: number): void {
        this.state.pollutionLevel -= amount;
        if (this.state.pollutionLevel < 0) this.state.pollutionLevel = 0;
    }
}

