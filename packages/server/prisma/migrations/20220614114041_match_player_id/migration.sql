/*
  Warnings:

  - The primary key for the `MatchPlayer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `MatchPlayer` table. All the data in the column will be lost.
  - Made the column `matchId` on table `MatchPlayer` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "MatchPlayer" DROP CONSTRAINT "MatchPlayer_matchId_fkey";

-- AlterTable
ALTER TABLE "MatchPlayer" DROP CONSTRAINT "MatchPlayer_pkey",
DROP COLUMN "id",
ALTER COLUMN "matchId" SET NOT NULL,
ADD CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("matchId", "steam64Id");

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
