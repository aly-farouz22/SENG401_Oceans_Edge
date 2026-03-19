import { prisma } from "../db";

export const saveGameState = async (data: any) => {
  // First make sure the player exists, create if not
  await prisma.player.upsert({
    where: { username: data.username },
    update: {},
    create: { username: data.username },
  });

  // Get the player to find their id
  const player = await prisma.player.findUnique({
    where: { username: data.username },
  });

  // Save or update their game state
  return prisma.gameState.upsert({
    where: { playerId: player!.id },
    update: { state: data.state },
    create: { playerId: player!.id, state: data.state },
  });
};

export const loadGameState = async (username: string) => {
  const player = await prisma.player.findUnique({
    where: { username },
    include: { gameState: true },
  });
  return player?.gameState ?? null;
};