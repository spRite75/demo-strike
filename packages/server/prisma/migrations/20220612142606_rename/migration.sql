/*
  Warnings:

  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "File";

-- CreateTable
CREATE TABLE "DemoFile" (
    "id" SERIAL NOT NULL,
    "filepath" TEXT NOT NULL,
    "parsed" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DemoFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DemoFile_filepath_key" ON "DemoFile"("filepath");
