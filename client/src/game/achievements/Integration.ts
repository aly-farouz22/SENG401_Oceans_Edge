// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATION_GUIDE.ts  (read-only reference – not compiled)
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Boot (PreloadScene or GameScene.create) ────────────────────────────────

import { AchievementManager } from "./AchievementManager";
import { AchievementToast } from "./AchievementToast";

// In your scene's create() or an async init function:
await AchievementManager.instance.init();

const toast = new AchievementToast(this); // 'this' = Phaser.Scene
AchievementManager.instance.onUnlock = (def) => toast.show(def);


// ── 2. Gameplay events ────────────────────────────────────────────────────────

// When a fish is caught:
AchievementManager.instance.updateStats({ totalFishCaught: 1 });

// When a rare fish is caught:
AchievementManager.instance.updateStats({ rareFishCaught: 1 });

// When fish are sold (pass the $ amount):
AchievementManager.instance.updateStats({ lifetimeEarnings: saleAmount });

// When a trash zone is cleaned:
AchievementManager.instance.updateStats({ trashZonesCleaned: 1 });

// When all upgrades are maxed:
AchievementManager.instance.updateStats({ allUpgradesMaxed: true });

// When balance goes negative mid-season:
AchievementManager.instance.updateStats({ hadNegativeBalance: true });

// When player recovers from negative → positive in same season:
AchievementManager.instance.updateStats({ recoveredFromNegative: true });


// ── 3. Season end (wire into SeasonEndScreen.show()) ─────────────────────────

// After calculating `net` and before showing the summary:
if (net < 0) {
  AchievementManager.instance.updateStats({ gameOverCount: 1 });
} else {
  AchievementManager.instance.updateStats({ seasonsCompleted: 1 });
}


// ── 4. Good ending ────────────────────────────────────────────────────────────

AchievementManager.instance.updateStats({ goodEndingReached: true });


// ── 5. Querying for a gallery screen ─────────────────────────────────────────

const all = AchievementManager.instance.getAll();
// all[i].unlocked === true/false  →  show gold vs silhouette in your UI


// ── 6. Swapping to a real backend ────────────────────────────────────────────
//
// In AchievementManager.ts, change:
//
//   new LocalAchievementStorage()
//
// to:
//
//   new ApiAchievementStorage(userId, "https://your-api.com")
//
// That's it. No other changes needed.