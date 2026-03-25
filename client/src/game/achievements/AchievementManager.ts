// ─────────────────────────────────────────────────────────────────────────────
// AchievementManager.ts
//
// Singleton.  Usage:
//
//   // Boot (once, e.g. in your preload scene):
//   await AchievementManager.instance.init();
//
//   // During gameplay:
//   AchievementManager.instance.updateStats({ totalFishCaught: 1 });
//
//   // Listen for unlocks (wire up your toast UI here):
//   AchievementManager.instance.onUnlock = (def) => toast.show(def);
//
//   // At season end:
//   AchievementManager.instance.updateStats({
//     seasonsCompleted: 1,
//     lifetimeEarnings: 240,
//   });
// ─────────────────────────────────────────────────────────────────────────────

import {
  ACHIEVEMENTS,
  AchievementDefinition,
  DEFAULT_STATS,
  PlayerStats,
} from "./AchievementDefinitions";

import {
  IAchievementStorage,
  LocalAchievementStorage,
  DbAchievementStorage,
} from "./AchievementStorage";

export class AchievementManager {
// ── Singleton ───────────────────────────────────────────────────────────────
private static _instance: AchievementManager;
static get instance(): AchievementManager {
  if (!AchievementManager._instance) {
    AchievementManager._instance = new AchievementManager(
      new LocalAchievementStorage()
      // Swapped to DbAchievementStorage once username is known — see switchToDbStorage()
    );
  }
  return AchievementManager._instance;
}

// ── State ───────────────────────────────────────────────────────────────────
private storage:  IAchievementStorage;
private unlocked: Set<string>  = new Set();
private stats:    PlayerStats  = { ...DEFAULT_STATS };
private ready     = false;

/** Fired whenever a new achievement is unlocked.
 *  Wire this up to your toast / notification system. */
public onUnlock?: (achievement: AchievementDefinition) => void;

// ── Constructor (private – use .instance) ───────────────────────────────────
private constructor(storage: IAchievementStorage) {
  this.storage = storage;
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Call at game start (await it). Safe to call multiple times — no-op after first. */
async init(): Promise<void> {
  if (this.ready) return;
  [this.unlocked, this.stats] = await Promise.all([
    this.storage.loadUnlocked(),
    this.storage.loadStats(),
  ]);
  this.ready = true;
}

/** Switch from LocalAchievementStorage to DbAchievementStorage once the
 *  username is known (called from BootScene after username is entered).
 *  Resets the ready flag so init() reloads from the database for this user. */
async switchToDbStorage(username: string): Promise<void> {
  this.storage = new DbAchievementStorage(username);
  this.ready   = false;
  this.unlocked = new Set();
  this.stats    = { ...DEFAULT_STATS };
  await this.init();
}

/** Merge a partial stats update, then check all achievements.
 *
 *  Examples:
 *    updateStats({ totalFishCaught: 1 })   // increment by 1
 *    updateStats({ allUpgradesMaxed: true })
 *
 *  NOTE: numeric fields are ADDED to the existing value.
 *        boolean / non-numeric fields are SET directly.
 */
updateStats(delta: Partial<PlayerStats>): void {
  this.assertReady();

  for (const key of Object.keys(delta) as (keyof PlayerStats)[]) {
    const val = delta[key];
    if (typeof val === "number" && typeof this.stats[key] === "number") {
      (this.stats as any)[key] += val;
    } else {
      (this.stats as any)[key] = val;
    }
  }

  this.storage.saveStats(this.stats); // fire-and-forget
  this.checkAll();
}

/** Directly set stats (useful for loading a save). */
setStats(stats: Partial<PlayerStats>): void {
  this.assertReady();
  this.stats = { ...DEFAULT_STATS, ...this.stats, ...stats };
  this.storage.saveStats(this.stats);
  this.checkAll();
}

/** Returns a snapshot of current stats. */
getStats(): Readonly<PlayerStats> {
  return { ...this.stats };
}

/** Returns all achievement definitions annotated with unlock status. */
getAll(): (AchievementDefinition & { unlocked: boolean })[] {
  return ACHIEVEMENTS.map(def => ({
    ...def,
    unlocked: this.unlocked.has(def.id),
  }));
}

/** Returns only unlocked achievements. */
getUnlocked(): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(def => this.unlocked.has(def.id));
}

/** Manually unlock an achievement (e.g. from a cutscene trigger). */
forceUnlock(achievementId: string): void {
  this.assertReady();
  const def = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!def) return;
  this.doUnlock(def);
}

/** Reset everything – useful for "new game". */
async reset(): Promise<void> {
  this.unlocked = new Set();
  this.stats    = { ...DEFAULT_STATS };
  await Promise.all([
    this.storage.saveStats(this.stats),
    // No bulk-delete method needed; unlock() is additive.
    // For real backends, add a DELETE /api/achievements/:userId endpoint.
  ]);
}

// ── Internal ────────────────────────────────────────────────────────────────

private checkAll(): void {
  for (const def of ACHIEVEMENTS) {
    if (!this.unlocked.has(def.id) && def.check(this.stats)) {
      this.doUnlock(def);
    }
  }
}

private doUnlock(def: AchievementDefinition): void {
  if (this.unlocked.has(def.id)) return;
  this.unlocked.add(def.id);
  console.log("🏅 Unlocking:", def.id, "| onUnlock set?", !!this.onUnlock); // ← add this
  this.onUnlock?.(def);
  this.storage.unlock(def.id);
}

private assertReady(): void {
  if (!this.ready) {
    throw new Error("AchievementManager: call await init() before using.");
  }
}
}