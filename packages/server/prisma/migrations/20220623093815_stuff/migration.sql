-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "matchInfoId" TEXT;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_matchInfoId_fkey" FOREIGN KEY ("matchInfoId") REFERENCES "MatchInfo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
