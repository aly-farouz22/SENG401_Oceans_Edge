export interface FishSpecies {
  name: string;
  population: number;
  regenerationRate: number;
  endangered: boolean;
  invasive: boolean;
  catchLimit: number; // seasonal limit for native species
  caughtThisSeason: number;
}

export interface EcosystemState {
  fishPopulations: FishSpecies[];
  coralHealth: number; // 0-100
  pollutionLevel: number; // 0-100
  acidityLevel: number; // 0-14
  biodiversityIndex: number; // 0-100
  overfishedSpecies: string[];
}

export class EcosystemSystem {
  private state: EcosystemState;

  constructor() {
    this.state = {
      fishPopulations: [
        {
          name: "Salmon",
          population: 1000,
          regenerationRate: 0.1,
          endangered: false,
          invasive: false,
          catchLimit: 120,
          caughtThisSeason: 0,
        },
        {
          name: "Tuna",
          population: 400,
          regenerationRate: 0.05,
          endangered: false,
          invasive: false,
          catchLimit: 50,
          caughtThisSeason: 0,
        },
        {
          name: "Bluefin",
          population: 60,
          regenerationRate: 0.02,
          endangered: true,
          invasive: false,
          catchLimit: 10,
          caughtThisSeason: 0,
        },
        {
          name: "Lionfish",
          population: 250,
          regenerationRate: 0.08,
          endangered: false,
          invasive: true,
          catchLimit: Infinity,
          caughtThisSeason: 0,
        },
      ],
      coralHealth: 100,
      pollutionLevel: 0,
      acidityLevel: 7,
      biodiversityIndex: 100,
      overfishedSpecies: [],
    };
  }

  public getState(): EcosystemState {
    return this.state;
  }

  public updateSeason(): void {
    this.regenerateFish();
    this.updateCoralHealth();
    this.updateAcidity();
    this.applyOverfishingPenalties();
    this.updateBiodiversityIndex();
    this.resetSeasonalCatch();
  }

  private regenerateFish(): void {
    const coralFactor = this.state.coralHealth / 100;
    const pollutionFactor = 1 - this.state.pollutionLevel / 100;
    const acidityStress =
      this.state.acidityLevel > 8 ? Math.max(0.5, 1 - (this.state.acidityLevel - 8) * 0.15) : 1;

    this.state.fishPopulations.forEach((fish) => {
      let effectiveRate = fish.regenerationRate * coralFactor * pollutionFactor * acidityStress;

      // Endangered fish recover more slowly
      if (fish.endangered) {
        effectiveRate *= 0.7;
      }

      // Invasive fish thrive more easily, especially in degraded ecosystems
      if (fish.invasive) {
        effectiveRate *= 1.2;
      }

      const growth = Math.floor(fish.population * effectiveRate);
      fish.population += growth;
    });
  }

  private updateCoralHealth(): void {
    const pollutionDamage = this.state.pollutionLevel * 0.05;
    const acidityDamage = Math.max(0, this.state.acidityLevel - 8) * 2;

    this.state.coralHealth -= pollutionDamage + acidityDamage;
    this.state.coralHealth = Math.max(0, Math.min(100, this.state.coralHealth));
  }

  private updateAcidity(): void {
    const pollutionImpact = this.state.pollutionLevel * 0.01;
    this.state.acidityLevel += pollutionImpact;
    this.state.acidityLevel = Math.max(0, Math.min(14, this.state.acidityLevel));
  }

  private applyOverfishingPenalties(): void {
    this.state.overfishedSpecies = [];

    this.state.fishPopulations.forEach((fish) => {
      if (!fish.invasive && fish.caughtThisSeason > fish.catchLimit) {
        this.state.overfishedSpecies.push(fish.name);

        // Penalty: reduce remaining population and future recovery
        fish.population = Math.max(0, fish.population - Math.floor(fish.population * 0.1));

        // Coral and biodiversity are also harmed by overfishing native species
        this.state.coralHealth = Math.max(0, this.state.coralHealth - 5);
      }
    });
  }

  private updateBiodiversityIndex(): void {
    const totalSpecies = this.state.fishPopulations.length;
    const healthySpecies = this.state.fishPopulations.filter(
      (fish) => fish.population > 50
    ).length;

    const endangeredPenalty = this.state.fishPopulations.filter(
      (fish) => fish.endangered && fish.population < 30
    ).length * 10;

    const pollutionPenalty = this.state.pollutionLevel * 0.2;
    const coralPenalty = (100 - this.state.coralHealth) * 0.3;

    let score =
      (healthySpecies / totalSpecies) * 100 - endangeredPenalty - pollutionPenalty - coralPenalty;

    this.state.biodiversityIndex = Math.max(0, Math.min(100, Math.round(score)));
  }

  public harvestFish(fishName: string, amount: number): void {
    const fish = this.state.fishPopulations.find((f) => f.name === fishName);
    if (!fish) return;

    fish.population -= amount;
    fish.population = Math.max(0, fish.population);

    fish.caughtThisSeason += amount;

    // Catching invasive species helps biodiversity slightly
    if (fish.invasive) {
      this.state.biodiversityIndex = Math.min(100, this.state.biodiversityIndex + 2);
    }
  }

  public addPollution(amount: number): void {
    this.state.pollutionLevel += amount;
    this.state.pollutionLevel = Math.max(0, Math.min(100, this.state.pollutionLevel));
  }

  public cleanPollution(amount: number): void {
    this.state.pollutionLevel -= amount;
    this.state.pollutionLevel = Math.max(0, Math.min(100, this.state.pollutionLevel));
  }

  private resetSeasonalCatch(): void {
    this.state.fishPopulations.forEach((fish) => {
      fish.caughtThisSeason = 0;
    });
  }

  public isGameOver(): boolean {
    const nativeSpeciesCollapsed = this.state.fishPopulations
      .filter((fish) => !fish.invasive)
      .every((fish) => fish.population <= 20);

    return (
      this.state.biodiversityIndex <= 10 ||
      this.state.coralHealth <= 10 ||
      nativeSpeciesCollapsed
    );
  }
}