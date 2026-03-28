// FuelSystem.ts
// Owns all fuel state for the player's boat.
// Designed to be created once on the Boat and then passed into
// BoatMovement (which drains it) and MarketZone (which refuels it)

import { EconomySystem } from "./EconomySystem";

export const FUEL_MAX      = 100;// Full tank size. also the starting amount
export const FUEL_COST     = 20;   // $ to refuel at market

//Drain rate
const DRAIN_PER_SECOND     = 100 / 30;//lasts 30seconds in concept

export class FuelSystem {
  private _fuel = FUEL_MAX;

  get fuel()    { return this._fuel; }
  get max()     { return FUEL_MAX; }
  get ratio()   { return this._fuel / FUEL_MAX; }
  get isEmpty() { return this._fuel <= 0; }

  // Called every frame that the boat is actually moving (not just idling).
  drain(delta: number): void {
    this._fuel = Math.max(0, this._fuel - DRAIN_PER_SECOND * (delta / 1000));
  }

  // When it returns false, movement is blocked and onFuelEmpty fires in MainScene, which then teleports the boat to dock and subtract towing fee
  canMove(): boolean {
    return this._fuel > 0;
  }


// Attempts to purchase a full refuel at the market dock.
  // Checks two things before spending: is the tank already full, and can
  // the player actually afford it
  refuel(economy: EconomySystem): boolean {
    if (this._fuel >= FUEL_MAX) return false;          // already full
    if (!economy.canAfford(FUEL_COST)) return false;   // can't afford
    economy.getState().balance      -= FUEL_COST;
    economy.getState().totalExpenses += FUEL_COST;
    this._fuel = FUEL_MAX;
    return true;
  }
  
  // Used during save/load to restore the exact fuel level from the save file.
  setFuel(amount: number): void {
    this._fuel = Math.max(0, Math.min(FUEL_MAX, amount));
  }

  /** Refill for free — used at season start. */
  refuelFree(): void {
    this._fuel = FUEL_MAX;
  }
}