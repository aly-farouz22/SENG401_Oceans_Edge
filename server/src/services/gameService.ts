import { prisma } from "../db";

// ── Helper: get or create a player by username ────────────────────────────
// Used by all service functions so we never duplicate player creation logic.
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
    create: { playerId: player.id, state: data.state },
  });
};

export const loadGameState = async (username: string) => {
  const player = await prisma.player.findUnique({
    where:   { username },
    include: { gameState: true },
  });
  return player?.gameState ?? null;
};

// ── Log a player choice ───────────────────────────────────────────────────
// Called whenever the player makes a significant decision:
//   "caught_endangered", "cleaned_trash", "bought_upgrade", "species_extinct"
// details is optional extra context e.g. { fishName: "Bluefin Tuna", season: 2 }

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
// Called when the game ends — either the player wins, goes bankrupt,
// or causes an ecosystem collapse.

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