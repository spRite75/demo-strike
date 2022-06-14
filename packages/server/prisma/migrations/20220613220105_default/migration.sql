/*
  Warnings:

  - Added the required column `fileCreated` to the `DemoFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileUpdated` to the `DemoFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DemoFile" ADD COLUMN     "fileCreated" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fileUpdated" TIMESTAMP(3) NOT NULL;
