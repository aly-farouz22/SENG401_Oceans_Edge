import Phaser from "phaser";
import FishingZone from "./FishingZone";
import { EcosystemSystem } from "../systems/EconomySystem";

const SEASON_NAMES = ["Spring", "Summer", "Autumn", "Winter"];
const SEASON_REGEN_AMOUNT = 4; // stock restored to each zone on new season
const SEASON_DURATION = 60000; // 60 seconds per season (Testing)

/**
 * Tracks the current season and handles zone regeneration when a new season starts.
 * Fires onSeasonChange when the season advances.
 */
export default class SeasonManager {
  private scene: Phaser.Scene;
  private zones: FishingZone[] = [];
  private ecosystem: EcosystemSystem;
  private timeElapsed: number = 0;
  private seasonDuration: number;
  season = 1;
  seasonName = SEASON_NAMES[0];

  onSeasonChange?: (season: number, seasonName: string) => void;

  constructor(scene: Phaser.Scene, ecosystem: EcosystemSystem, seasonDuration: number = SEASON_DURATION) {
    this.scene = scene;
    this.ecosystem = ecosystem;
    this.seasonDuration = seasonDuration;
  }

  registerZones(zones: FishingZone[]) {
    this.zones = zones;
  }
  update(time: number) {
    this.timeElapsed += time;
    if (this.timeElapsed >= this.seasonDuration) {
      this.advanceSeason();
      this.timeElapsed = 0;
    }
  }
  /** Call this when the player chooses "End Season" at the market. */
  advanceSeason() {
    this.season++;
    this.seasonName = SEASON_NAMES[(this.season - 1) % SEASON_NAMES.length];

    // Partially regenerate all zones that still exist
    this.zones.forEach(zone => {
      if (!zone.isGone) {
        zone.regenStock(SEASON_REGEN_AMOUNT);
      }
    });
    this.ecosystem.updateSeason();
    this.onSeasonChange?.(this.season, this.seasonName);
    console.log('Season Advanced to ${this.seasonName} (Season ${this.season})')
  }
}