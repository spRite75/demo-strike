/*
  Warnings:

  - The primary key for the `Match` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "MatchPlayer" DROP CONSTRAINT "MatchPlayer_matchId_fkey";

-- AlterTable
ALTER TABLE "Match" DROP CONSTRAINT "Match_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Match_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Match_id_seq";

-- AlterTable
ALTER TABLE "MatchPlayer" ALTER COLUMN "matchId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
