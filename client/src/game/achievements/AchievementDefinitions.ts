// ─────────────────────────────────────────────────────────────────────────────
// AchievementDefinitions.ts
// Add / remove achievements here – no other file needs to change.
// ─────────────────────────────────────────────────────────────────────────────

export interface AchievementDefinition {
  id:          string;
  name:        string;
  description: string;
  icon:        string;       // emoji used in toasts / gallery
  category:    "catch" | "profit" | "survival" | "ecology" | "upgrades" | "ending";
  /** Return true when this achievement should unlock */
  check:       (stats: PlayerStats) => boolean;
}

/** All runtime stats the achievement system tracks.
 *  Add new fields here as the game grows – existing checks won't break. */
export interface PlayerStats {
  totalFishCaught:    number;
  rareFishCaught:     number;
  lifetimeEarnings:   number;
  seasonsCompleted:   number;
  trashZonesCleaned:  number;
  totalTrashZones:    number;   // set this to the map's total so "clean all" works
  allUpgradesMaxed:   boolean;
  gameOverCount:      number;
  goodEndingReached:  boolean;
  /** true if balance was negative at ANY point this season */
  hadNegativeBalance: boolean;
  /** true if the player recovered from negative to positive this season */
  recoveredFromNegative: boolean;
}

export const DEFAULT_STATS: PlayerStats = {
  totalFishCaught:      0,
  rareFishCaught:       0,
  lifetimeEarnings:     0,
  seasonsCompleted:     0,
  trashZonesCleaned:    0,
  totalTrashZones:      0,
  allUpgradesMaxed:     false,
  gameOverCount:        0,
  goodEndingReached:    false,
  hadNegativeBalance:   false,
  recoveredFromNegative: false,
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ── Catch milestones ────────────────────────────────────────────────────────
  {
    id: "first_catch",
    name: "First Cast",
    description: "Catch your very first fish.",
    icon: "🎣",
    category: "catch",
    check: s => s.totalFishCaught >= 1,
  },
  {
    id: "catch_10",
    name: "Getting the Hang of It",
    description: "Catch 10 fish total.",
    icon: "🐟",
    category: "catch",
    check: s => s.totalFishCaught >= 10,
  },
  {
    id: "catch_50",
    name: "Seasoned Fisher",
    description: "Catch 50 fish total.",
    icon: "🐠",
    category: "catch",
    check: s => s.totalFishCaught >= 50,
  },
  {
    id: "catch_200",
    name: "Master Angler",
    description: "Catch 200 fish total.",
    icon: "🏆",
    category: "catch",
    check: s => s.totalFishCaught >= 200,
  },
  {
    id: "rare_catch",
    name: "Lucky Find",
    description: "Catch your first rare fish.",
    icon: "✨",
    category: "catch",
    check: s => s.rareFishCaught >= 1,
  },
  {
    id: "rare_catch_10",
    name: "Rare Collector",
    description: "Catch 10 rare fish.",
    icon: "💎",
    category: "catch",
    check: s => s.rareFishCaught >= 10,
  },

  // ── Profit milestones ───────────────────────────────────────────────────────
  {
    id: "profit_100",
    name: "First Profit",
    description: "Earn $100 in lifetime fish sales.",
    icon: "💵",
    category: "profit",
    check: s => s.lifetimeEarnings >= 100,
  },
  {
    id: "profit_500",
    name: "In The Black",
    description: "Earn $500 in lifetime fish sales.",
    icon: "💰",
    category: "profit",
    check: s => s.lifetimeEarnings >= 500,
  },
  {
    id: "profit_2000",
    name: "Tycoon",
    description: "Earn $2,000 in lifetime fish sales.",
    icon: "🤑",
    category: "profit",
    check: s => s.lifetimeEarnings >= 2000,
  },

  // ── Survival ─────────────────────────────────────────────────────────────────
  {
    id: "survive_1",
    name: "Afloat",
    description: "Complete your first season.",
    icon: "⛵",
    category: "survival",
    check: s => s.seasonsCompleted >= 1,
  },
  {
    id: "survive_3",
    name: "Veteran",
    description: "Complete 3 seasons.",
    icon: "🌊",
    category: "survival",
    check: s => s.seasonsCompleted >= 3,
  },
  {
    id: "survive_10",
    name: "Old Salt",
    description: "Complete 10 seasons.",
    icon: "⚓",
    category: "survival",
    check: s => s.seasonsCompleted >= 10,
  },
  {
    id: "comeback",
    name: "Comeback Kid",
    description: "Recover from a negative balance in the same season.",
    icon: "📈",
    category: "survival",
    check: s => s.recoveredFromNegative,
  },

  // ── Ecology ─────────────────────────────────────────────────────────────────
  {
    id: "clean_first",
    name: "Eco Warrior",
    description: "Clean your first trash zone.",
    icon: "♻️",
    category: "ecology",
    check: s => s.trashZonesCleaned >= 1,
  },
  {
    id: "clean_all",
    name: "Ocean Guardian",
    description: "Clean every trash zone on the map.",
    icon: "🌊",
    category: "ecology",
    check: s => s.totalTrashZones > 0 && s.trashZonesCleaned >= s.totalTrashZones,
  },

  // ── Upgrades ────────────────────────────────────────────────────────────────
  {
    id: "max_upgrades",
    name: "Fully Loaded",
    description: "Max out every upgrade.",
    icon: "🔧",
    category: "upgrades",
    check: s => s.allUpgradesMaxed,
  },

  // ── Endings ─────────────────────────────────────────────────────────────────
  {
    id: "game_over",
    name: "Rock Bottom",
    description: "Hit a game over.",
    icon: "💀",
    category: "ending",
    check: s => s.gameOverCount >= 1,
  },
  {
    id: "good_ending",
    name: "Living The Dream",
    description: "Reach the good ending.",
    icon: "🌅",
    category: "ending",
    check: s => s.goodEndingReached,
  },
];