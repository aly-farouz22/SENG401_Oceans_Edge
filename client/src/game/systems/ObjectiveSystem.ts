// ─────────────────────────────────────────────────────────────────────────────
// ObjectiveSystem.ts
//
// Owns all per-season and long-term objectives.
//
// Usage:
//   const obj = new ObjectiveSystem();
//   obj.startSeason(1);
//   obj.updateStats({ moneyEarned: 50 });
//   obj.getSeasonObjectives();   // current season's objectives + status
//   obj.getLongTermObjectives(); // cross-season objectives + status
//   obj.evaluateSeason();        // call at season end — returns pass/fail per objective
// ─────────────────────────────────────────────────────────────────────────────

export interface Objective {
  id:          string;
  label:       string;
  description: string;
  icon:        string;
  target:      number;
  current:     number;
  completed:   boolean;
  failed:      boolean;   // for "avoid" type objectives
  isAvoid:     boolean;   // true = fail if current > 0
}

export interface SeasonStats {
  moneyEarned:         number;  // fish sales this season
  ecosystemHealth:     number;  // current coral health %
  trashZonesCleaned:   number;  // cleaned this season
  endangeredCaught:    number;  // endangered fish caught this season
}

export interface LongTermStats {
  consecutiveSeasons:       number;  // seasons survived without going negative
  totalTrashCleaned:        number;  // all-time trash zones cleaned
  totalEndangeredCaught:    number;  // all-time endangered catches
  bestConsecutiveStreak:    number;
}

export default class ObjectiveSystem {
  private season       = 1;
  private seasonStats: SeasonStats = this.blankSeasonStats();
  private longTermStats: LongTermStats = {
    consecutiveSeasons:    0,
    totalTrashCleaned:     0,
    totalEndangeredCaught: 0,
    bestConsecutiveStreak: 0,
  };

  private _seasonObjectives:   Objective[] = [];
  private _longTermObjectives: Objective[] = [];

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Call at the start of each season to generate fresh objectives. */
  startSeason(season: number): void {
    this.season      = season;
    this.seasonStats = this.blankSeasonStats();
    this._seasonObjectives   = this.buildSeasonObjectives(season);
    this._longTermObjectives = this.buildLongTermObjectives();
  }

  /** Update stats during gameplay — call whenever something relevant happens. */
  updateStats(delta: Partial<SeasonStats>): void {
    if (delta.moneyEarned      !== undefined) this.seasonStats.moneyEarned      += delta.moneyEarned;
    if (delta.trashZonesCleaned !== undefined) {
      this.seasonStats.trashZonesCleaned  += delta.trashZonesCleaned;
      this.longTermStats.totalTrashCleaned += delta.trashZonesCleaned;
    }
    if (delta.endangeredCaught !== undefined) {
      this.seasonStats.endangeredCaught      += delta.endangeredCaught;
      this.longTermStats.totalEndangeredCaught += delta.endangeredCaught;
    }
    if (delta.ecosystemHealth !== undefined) {
      this.seasonStats.ecosystemHealth = delta.ecosystemHealth;
    }
    this.refreshObjectiveStatus();
  }

  /** Call at season end to finalise — returns whether all required objectives passed. */
  evaluateSeason(survivedWithoutNegative: boolean): {
    seasonPassed: boolean;
    results: { id: string; label: string; passed: boolean }[];
  } {
    if (survivedWithoutNegative) {
      this.longTermStats.consecutiveSeasons++;
      this.longTermStats.bestConsecutiveStreak = Math.max(
        this.longTermStats.bestConsecutiveStreak,
        this.longTermStats.consecutiveSeasons
      );
    } else {
      this.longTermStats.consecutiveSeasons = 0;
    }

    this.refreshObjectiveStatus();
    this.refreshLongTermStatus();

    const results = this._seasonObjectives.map(o => ({
      id:     o.id,
      label:  o.label,
      passed: o.isAvoid ? !o.failed : o.completed,
    }));

    const seasonPassed = results.every(r => r.passed);
    return { seasonPassed, results };
  }

  getSeasonObjectives():   Objective[] { return this._seasonObjectives; }
  getLongTermObjectives(): Objective[] { return this._longTermObjectives; }
  getSeasonStats():        SeasonStats { return { ...this.seasonStats }; }
  getLongTermStats():      LongTermStats { return { ...this.longTermStats }; }

  // ── Build objectives ────────────────────────────────────────────────────────

  private buildSeasonObjectives(season: number): Objective[] {
    const moneyTarget     = Math.round(150 * Math.pow(1.2, season - 1));
    const ecoThreshold    = Math.max(40, 70 - (season - 1) * 4);
    const trashTarget     = season <= 2 ? 1 : Math.min(season - 1, 4);

    return [
      {
        id:          "earn_money",
        label:       `Earn $${moneyTarget}`,
        description: `Sell enough fish to earn $${moneyTarget} this season.`,
        icon:        "💰",
        target:      moneyTarget,
        current:     0,
        completed:   false,
        failed:      false,
        isAvoid:     false,
      },
      {
        id:          "ecosystem_health",
        label:       `Ecosystem >${ecoThreshold}%`,
        description: `Keep coral health above ${ecoThreshold}% by season end.`,
        icon:        "🪸",
        target:      ecoThreshold,
        current:     100,
        completed:   true,  // starts true, fails if health drops
        failed:      false,
        isAvoid:     false,
      },
      {
        id:          "clean_trash",
        label:       `Clean ${trashTarget} trash zone${trashTarget > 1 ? "s" : ""}`,
        description: `Clean at least ${trashTarget} trash zone${trashTarget > 1 ? "s" : ""} this season.`,
        icon:        "♻️",
        target:      trashTarget,
        current:     0,
        completed:   false,
        failed:      false,
        isAvoid:     false,
      },
      {
        id:          "no_endangered",
        label:       "Protect endangered fish",
        description: "Don't catch any endangered fish this season.",
        icon:        "🐟",
        target:      0,
        current:     0,
        completed:   true,
        failed:      false,
        isAvoid:     true,
      },
    ];
  }

  private buildLongTermObjectives(): Objective[] {
    const lt = this.longTermStats;
    return [
      {
        id:          "streak_3",
        label:       "3-season streak",
        description: "Survive 3 seasons in a row without going negative.",
        icon:        "🔥",
        target:      3,
        current:     lt.consecutiveSeasons,
        completed:   lt.consecutiveSeasons >= 3,
        failed:      false,
        isAvoid:     false,
      },
      {
        id:          "clean_10",
        label:       "Clean 10 trash zones",
        description: "Clean 10 trash zones across all seasons.",
        icon:        "🌊",
        target:      10,
        current:     lt.totalTrashCleaned,
        completed:   lt.totalTrashCleaned >= 10,
        failed:      false,
        isAvoid:     false,
      },
      {
        id:          "no_endangered_ever",
        label:       "Conservation hero",
        description: "Never catch an endangered fish across the whole run.",
        icon:        "🛡️",
        target:      0,
        current:     lt.totalEndangeredCaught,
        completed:   lt.totalEndangeredCaught === 0,
        failed:      lt.totalEndangeredCaught > 0,
        isAvoid:     true,
      },
    ];
  }

  // ── Refresh status ──────────────────────────────────────────────────────────

  private refreshObjectiveStatus(): void {
    const s = this.seasonStats;
    for (const o of this._seasonObjectives) {
      switch (o.id) {
        case "earn_money":
          o.current   = s.moneyEarned;
          o.completed = s.moneyEarned >= o.target;
          break;
        case "ecosystem_health":
          o.current   = s.ecosystemHealth;
          o.completed = s.ecosystemHealth >= o.target;
          o.failed    = s.ecosystemHealth < o.target;
          break;
        case "clean_trash":
          o.current   = s.trashZonesCleaned;
          o.completed = s.trashZonesCleaned >= o.target;
          break;
        case "no_endangered":
          o.current   = s.endangeredCaught;
          o.failed    = s.endangeredCaught > 0;
          o.completed = s.endangeredCaught === 0;
          break;
      }
    }
  }

  private refreshLongTermStatus(): void {
    const lt = this.longTermStats;
    for (const o of this._longTermObjectives) {
      switch (o.id) {
        case "streak_3":
          o.current   = lt.consecutiveSeasons;
          o.completed = lt.consecutiveSeasons >= 3;
          break;
        case "clean_10":
          o.current   = lt.totalTrashCleaned;
          o.completed = lt.totalTrashCleaned >= 10;
          break;
        case "no_endangered_ever":
          o.current   = lt.totalEndangeredCaught;
          o.failed    = lt.totalEndangeredCaught > 0;
          o.completed = lt.totalEndangeredCaught === 0;
          break;
      }
    }
  }

  private blankSeasonStats(): SeasonStats {
    return { moneyEarned: 0, ecosystemHealth: 100, trashZonesCleaned: 0, endangeredCaught: 0 };
  }
}