/*
  Warnings:

  - The `headshotPercentage` column on the `MatchPlayer` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "MatchPlayer" DROP COLUMN "headshotPercentage",
ADD COLUMN     "headshotPercentage" DECIMAL(5,2);
