import Phaser from "phaser";
import FishingZone from "./FishingZone";

const SEASON_NAMES = ["Spring", "Summer", "Autumn", "Winter"];
const SEASON_REGEN_AMOUNT = 4; // stock restored to each zone on new season

/**
 * Tracks the current season and handles zone regeneration when a new season starts.
 * Fires onSeasonChange when the season advances.
 */
export default class SeasonManager {
  private scene: Phaser.Scene;
  private zones: FishingZone[] = [];

  season = 1;
  seasonName = SEASON_NAMES[0];

  onSeasonChange?: (season: number, seasonName: string) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  registerZones(zones: FishingZone[]) {
    this.zones = zones;
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

    this.onSeasonChange?.(this.season, this.seasonName);
  }
}