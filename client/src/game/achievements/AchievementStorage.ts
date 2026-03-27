// ─────────────────────────────────────────────────────────────────────────────
// AchievementStorage.ts
//
// All persistence lives here.  To add a real backend later:
//   1. Implement IAchievementStorage with your API calls
//   2. Pass it into AchievementManager's constructor
//   Nothing else needs to change.
// ─────────────────────────────────────────────────────────────────────────────

import { DEFAULT_STATS, PlayerStats } from "./AchievementDefinitions";
import { saveAchievements, loadAchievements } from "../../services/api";

const STORAGE_KEY_UNLOCKED = "ach_unlocked";
const STORAGE_KEY_STATS    = "ach_stats";

// Interface

export interface IAchievementStorage {
  loadUnlocked(): Promise<Set<string>>;
  unlock(achievementId: string): Promise<void>;
  loadStats(): Promise<PlayerStats>;
  saveStats(stats: PlayerStats): Promise<void>;
}

// Local-storage implementation

export class LocalAchievementStorage implements IAchievementStorage {
  async loadUnlocked(): Promise<Set<string>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_UNLOCKED);
      if (!raw) return new Set();
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      return new Set();
    }
  }

  async unlock(achievementId: string): Promise<void> {
    const current = await this.loadUnlocked();
    current.add(achievementId);
    localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify([...current]));
  }

  async loadStats(): Promise<PlayerStats> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STATS);
      if (!raw) return { ...DEFAULT_STATS };
      // Merge with defaults so new fields don't break old saves
      return { ...DEFAULT_STATS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_STATS };
    }
  }

  async saveStats(stats: PlayerStats): Promise<void> {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  }
}

// Database-backed implementation:
// Stores achievements per-player in Supabase so each username has
// their own badges instead of sharing a single localStorage entry.

export class DbAchievementStorage implements IAchievementStorage {
  private username:    string;
  private unlocked:   Set<string>  = new Set();
  private stats:      PlayerStats  = { ...DEFAULT_STATS };
  private loaded      = false;

  constructor(username: string) {
    this.username = username;
  }

  // Load from database once, cache locally after that
  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;

    const data = await loadAchievements(this.username);
    if (data) {
      this.unlocked = new Set(data.unlockedIds);
      this.stats    = { ...DEFAULT_STATS, ...(data.stats as Partial<PlayerStats>) };
    }
  }

  async loadUnlocked(): Promise<Set<string>> {
    await this.ensureLoaded();
    return new Set(this.unlocked);
  }

  async unlock(achievementId: string): Promise<void> {
    await this.ensureLoaded();
    this.unlocked.add(achievementId);
    // Persist to database immediately on unlock
    await saveAchievements(this.username, [...this.unlocked], this.stats);
  }

  async loadStats(): Promise<PlayerStats> {
    await this.ensureLoaded();
    return { ...this.stats };
  }

  async saveStats(stats: PlayerStats): Promise<void> {
    await this.ensureLoaded();
    this.stats = stats;
    // Persist to database
    await saveAchievements(this.username, [...this.unlocked], this.stats);
  }
}