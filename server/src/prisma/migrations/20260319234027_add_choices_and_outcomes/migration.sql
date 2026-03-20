-- CreateTable
CREATE TABLE "Choice" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Choice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameOutcome" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "finalBalance" INTEGER NOT NULL,
    "seasonsPlayed" INTEGER NOT NULL,
    "coralHealth" DOUBLE PRECISION NOT NULL,
    "pollutionLevel" DOUBLE PRECISION NOT NULL,
    "extinctSpecies" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameOutcome_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Choice" ADD CONSTRAINT "Choice_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameOutcome" ADD CONSTRAINT "GameOutcome_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
