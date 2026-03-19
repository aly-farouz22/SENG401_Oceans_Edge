import prisma from "./prismaClient";

async function main() {
  // Create a test save
  const save = await prisma.gameSave.create({
    data: {
      playerId: "player_1",
      state: { money: 100, season: 1, balance: 1000 },
    },
  });
  console.log("Created game save:", save);

  // Fetch all saves
  const saves = await prisma.gameSave.findMany();
  console.log("All game saves:", saves);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());