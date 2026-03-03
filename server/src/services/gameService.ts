import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const saveGameState = async (data: any) => {
  return prisma.gameState.upsert({
    where: { playerId: data.playerId },
    update: { state: data.state },
    create: {
      playerId: data.playerId,
      state: data.state
    }
  });
};

export const loadGameState = async (playerId: string) => {
  return prisma.gameState.findUnique({
    where: { playerId }
  });
};