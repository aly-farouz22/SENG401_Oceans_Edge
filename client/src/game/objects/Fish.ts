import Phaser from "phaser";

export default class Fish {
    readonly name:        string;
    readonly endangered:  boolean;
    readonly baseValue:   number;   // base $ value per fish at the market
  
    population:       number;
    regenerationRate: number; // fraction of population regrown per season (0.0 - 1.0)
  
    // The starting population is stored so we can calculate health as a percentage
    private readonly initialPopulation: number;
  
    // Thresholds that define population health — expressed as a fraction of initial population
    // e.g. 0.3 means "below 30% of starting population = overfished"
    private static readonly OVERFISHED_THRESHOLD  = 0.3;
    private static readonly RECOVERING_THRESHOLD  = 0.6;
  
    constructor(
      name:            string,
      population:      number,
      regenerationRate: number,
      endangered:      boolean,
      baseValue:       number
    ) {
      this.name             = name;
      this.population       = population;
      this.regenerationRate = regenerationRate;
      this.endangered       = endangered;
      this.baseValue        = baseValue;
      this.initialPopulation = population; // snapshot of starting population
    }
  
    // ── Population health queries ─────────────────────────────────────────────
  
    /**
     * Returns population health as a percentage of the initial population.
     * 100 = fully healthy, 0 = extinct.
     * Clamped to 0-100 so it's safe to display directly in the HUD.
     */
    public getHealthPercent(): number {
      if (this.initialPopulation === 0) return 0;
      return Math.min(100, Math.max(0, (this.population / this.initialPopulation) * 100));
    }
  
    /**
     * Returns true if the population has dropped below the overfished threshold.
     * Used by FishingZone and HUD to warn the player.
     */
    public isOverfished(): boolean {
      return this.population < this.initialPopulation * Fish.OVERFISHED_THRESHOLD;
    }
  
    /**
     * Returns true if the population is recovering but not yet fully healthy.
     * Useful for showing a "recovering" status in the HUD.
     */
    public isRecovering(): boolean {
      const healthFraction = this.population / this.initialPopulation;
      return (
        healthFraction >= Fish.OVERFISHED_THRESHOLD &&
        healthFraction < Fish.RECOVERING_THRESHOLD
      );
    }
  
    /**
     * Returns true if the population has dropped to zero.
     */
    public isExtinct(): boolean {
      return this.population <= 0;
    }
  
    /**
     * Returns true if it is safe to harvest the given amount.
     * Blocks harvest if:
     *   - The species is already overfished
     *   - The harvest would push the population below the overfished threshold
     *   - The population is already zero
     */
    public canHarvest(amount: number): boolean {
      if (this.isExtinct() || this.isOverfished()) return false;
      const populationAfterHarvest = this.population - amount;
      return populationAfterHarvest >= this.initialPopulation * Fish.OVERFISHED_THRESHOLD;
    }
  
    // ── Population mutations ──────────────────────────────────────────────────
  
    public harvest(amount: number): void {
      let actualAmount = amount;
  
      // Endangered species suffer extra population loss per catch
      // because removing them disrupts the ecosystem more severely
      if (this.endangered) {
        actualAmount = amount * 1.5;
      }
  
      this.population = Math.max(0, this.population - actualAmount);
    }
  

    public regenerate(): void {
      if (this.isExtinct()) return;
  
      // Logistic growth factor — slows regeneration as population fills up
      const capacityFactor = 1 - (this.population / this.initialPopulation);
      const growth = this.population * this.regenerationRate * capacityFactor;
  
      this.population = Math.min(this.initialPopulation, this.population + growth);
    }
  

    public penalizeRegeneration(factor: number): void {
      this.regenerationRate = Math.max(0, this.regenerationRate * factor);
    }
  
    // ── Display helpers ───────────────────────────────────────────────────────
  

    public getStatusLabel(): string {
      if (this.isExtinct())   return "Extinct";
      if (this.isOverfished()) return this.endangered ? "Critically Endangered" : "Overfished";
      if (this.isRecovering()) return "Recovering";
      return this.endangered ? "Endangered" : "Healthy";
    }
  

    public getStatusColor(): string {
      if (this.isExtinct())    return "#ff2222"; // red — extinct
      if (this.isOverfished()) return "#ff4422"; // orange-red — overfished
      if (this.isRecovering()) return "#ffdd44"; // yellow — recovering
      return "#44ff88";                          // green — healthy
    }
  
    public toSummary(): {
      name: string;
      population: number;
      healthPercent: number;
      status: string;
      endangered: boolean;
    } {
      return {
        name:          this.name,
        population:    Math.floor(this.population),
        healthPercent: Math.floor(this.getHealthPercent()),
        status:        this.getStatusLabel(),
        endangered:    this.endangered,
      };
    }
  }