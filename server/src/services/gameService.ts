import { prisma } from "../db";

// ── Helper: get or create a player by username ────────────────────────────
const getOrCreatePlayer = async (username: string) => {
  return prisma.player.upsert({
    where:  { username },
    update: {},
    create: { username },
  });
};

// ── Save / load game state ────────────────────────────────────────────────

export const saveGameState = async (data: { username: string; state: object }) => {
  const player = await getOrCreatePlayer(data.username);

  return prisma.gameState.upsert({
    where:  { playerId: player.id },
    update: { state: data.state },
    create: { playerId: player.id, state: data.state, achievements: {} },
  });
};

export const loadGameState = async (username: string) => {
  const player = await prisma.player.findUnique({
    where:   { username },
    include: { gameState: true },
  });
  return player?.gameState ?? null;
};

// ── Check if a player already exists ─────────────────────────────────────
// Used by BootScene to decide whether to show "Continue" or start fresh.
export const playerExists = async (username: string): Promise<boolean> => {
  const player = await prisma.player.findUnique({ where: { username } });
  return player !== null;
};

// ── Save achievements for a player ───────────────────────────────────────
// Stores unlocked badge IDs and player stats in the GameState row
// so each player has their own badges instead of sharing localStorage.
export const saveAchievements = async (data: {
  username:     string;
  unlockedIds:  string[];
  stats:        object;
}) => {
  const player = await getOrCreatePlayer(data.username);

  const achievements = {
    unlockedIds: data.unlockedIds,
    stats:       data.stats,
  };

  return prisma.gameState.upsert({
    where:  { playerId: player.id },
    update: { achievements },
    create: { playerId: player.id, state: {}, achievements },
  });
};

// ── Load achievements for a player ───────────────────────────────────────
// Returns the stored unlocked IDs and stats, or null if none saved yet.
export const loadAchievements = async (username: string): Promise<{
  unlockedIds: string[];
  stats:       object;
} | null> => {
  const player = await prisma.player.findUnique({
    where:   { username },
    include: { gameState: true },
  });

  if (!player?.gameState?.achievements) return null;

  const ach = player.gameState.achievements as any;
  return {
    unlockedIds: ach.unlockedIds ?? [],
    stats:       ach.stats       ?? {},
  };
};

// ── Log a player choice ───────────────────────────────────────────────────
export const logChoice = async (data: {
  username: string;
  decision: string;
  details?: object;
}) => {
  const player = await getOrCreatePlayer(data.username);

  return prisma.choice.create({
    data: {
      playerId: player.id,
      decision: data.decision,
      details:  data.details ?? {},
    },
  });
};

// ── Save a game outcome ───────────────────────────────────────────────────
export const saveOutcome = async (data: {
  username:       string;
  result:         string;
  finalBalance:   number;
  seasonsPlayed:  number;
  coralHealth:    number;
  pollutionLevel: number;
  extinctSpecies: string[];
}) => {
  const player = await getOrCreatePlayer(data.username);

  return prisma.gameOutcome.create({
    data: {
      playerId:       player.id,
      result:         data.result,
      finalBalance:   data.finalBalance,
      seasonsPlayed:  data.seasonsPlayed,
      coralHealth:    data.coralHealth,
      pollutionLevel: data.pollutionLevel,
      extinctSpecies: data.extinctSpecies,
    },
  });
};