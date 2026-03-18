import Phaser from "phaser";
import { EcosystemSystem } from "../systems/EcosystemSystem";
import FishingZone from "./FishingZone";

const SEASON_NAMES = ["Spring", "Summer", "Autumn", "Winter"];
const SEASON_REGEN_AMOUNT = 4;
const SEASON_DURATION = 60000;

export default class SeasonManager {
  private scene: Phaser.Scene;
  private zones: FishingZone[] = [];
  private ecosystem: EcosystemSystem;
  private timeElapsed: number = 0;
  private seasonDuration: number;

  season = 1;
  seasonName = SEASON_NAMES[0];

  onSeasonChange?:     (season: number, seasonName: string) => void;
  onSeasonCostFailed?: () => void;

  constructor(scene: Phaser.Scene, ecosystem: EcosystemSystem, seasonDuration: number = SEASON_DURATION) {
    this.scene = scene;
    this.ecosystem = ecosystem;
    this.seasonDuration = seasonDuration;
  }

  registerZones(zones: FishingZone[]) {
    this.zones = zones;
  }

  update(delta: number) {
  }

  advanceSeason() {
    this.season++;
    this.seasonName = SEASON_NAMES[(this.season - 1) % SEASON_NAMES.length];

    this.zones.forEach(zone => {
      if (!zone.isGone) zone.regenStock(SEASON_REGEN_AMOUNT);
    });

    this.ecosystem.updateSeason();
    this.onSeasonChange?.(this.season, this.seasonName);
    console.log(`Season Advanced to ${this.seasonName} (Season ${this.season})`);
  }
}