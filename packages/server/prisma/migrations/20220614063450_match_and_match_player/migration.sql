-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "demoFileId" INTEGER NOT NULL,
    "mapName" TEXT NOT NULL,
    "serverName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "id" SERIAL NOT NULL,
    "steam64Id" TEXT NOT NULL,
    "kills" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    "headshotPercentage" TEXT NOT NULL,
    "matchId" INTEGER,

    CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_demoFileId_key" ON "Match"("demoFileId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_demoFileId_fkey" FOREIGN KEY ("demoFileId") REFERENCES "DemoFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
