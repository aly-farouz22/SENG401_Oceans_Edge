// ─────────────────────────────────────────────────────────────────────────────
// FuelSystem.ts
//
// Owns all fuel state. Pass to BoatMovement and MarketZone.
//
// Usage:
//   const fuel = new FuelSystem();
//   fuel.drain(delta);        // call each frame when moving
//   fuel.canMove();           // false when empty
//   fuel.refuel(economy);     // call from market
// ─────────────────────────────────────────────────────────────────────────────

import { EconomySystem } from "./EconomySystem";

export const FUEL_MAX      = 100;
export const FUEL_COST     = 20;   // $ to refuel at market
// Medium drain: 100 units over ~90s of movement = ~1.11 per second
const DRAIN_PER_SECOND     = 100 / 30;

export class FuelSystem {
  private _fuel = FUEL_MAX;

  get fuel()    { return this._fuel; }
  get max()     { return FUEL_MAX; }
  get ratio()   { return this._fuel / FUEL_MAX; }
  get isEmpty() { return this._fuel <= 0; }

  /** Call each frame the boat is actually moving, passing delta in ms. */
  drain(delta: number): void {
    this._fuel = Math.max(0, this._fuel - DRAIN_PER_SECOND * (delta / 1000));
  }

  /** Returns false when out of fuel — BoatMovement should stop. */
  canMove(): boolean {
    return this._fuel > 0;
  }

  /** Buy a full tank. Returns true if purchase succeeded. */
  refuel(economy: EconomySystem): boolean {
    if (this._fuel >= FUEL_MAX) return false;          // already full
    if (!economy.canAfford(FUEL_COST)) return false;   // can't afford
    economy.getState().balance      -= FUEL_COST;
    economy.getState().totalExpenses += FUEL_COST;
    this._fuel = FUEL_MAX;
    return true;
  }

  setFuel(amount: number): void {
    this._fuel = Math.max(0, Math.min(FUEL_MAX, amount));
  }

  /** Refill for free — used at season start. */
  refuelFree(): void {
    this._fuel = FUEL_MAX;
  }
}