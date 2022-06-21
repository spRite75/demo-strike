/*
  Warnings:

  - Added the required column `matchTeamId` to the `MatchPlayer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MatchPlayer" ADD COLUMN     "matchTeamId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MatchTeam" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "scoreFirstHalf" INTEGER NOT NULL,
    "scoreSecondHalf" INTEGER NOT NULL,
    "scoreTotal" INTEGER NOT NULL,

    CONSTRAINT "MatchTeam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchTeam_matchId_team_key" ON "MatchTeam"("matchId", "team");

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchTeamId_fkey" FOREIGN KEY ("matchTeamId") REFERENCES "MatchTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchTeam" ADD CONSTRAINT "MatchTeam_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
