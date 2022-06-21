-- CreateTable
CREATE TABLE "LocalUser" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "LocalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoFile" (
    "id" SERIAL NOT NULL,
    "filepath" TEXT NOT NULL,
    "fileCreated" TIMESTAMP(3) NOT NULL,
    "fileUpdated" TIMESTAMP(3) NOT NULL,
    "isParsed" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DemoFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "demoFileId" INTEGER NOT NULL,
    "mapName" TEXT NOT NULL,
    "serverName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "steam64Id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "steamProfileUrl" TEXT,
    "steamAvatarUrlDefault" TEXT,
    "steamAvatarUrlMedium" TEXT,
    "steamAvatarUrlFull" TEXT,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT E'player',
    "kills" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    "headshotPercentage" TEXT NOT NULL,
    "playerId" INTEGER NOT NULL,

    CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalUser_username_key" ON "LocalUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "DemoFile_filepath_key" ON "DemoFile"("filepath");

-- CreateIndex
CREATE UNIQUE INDEX "Match_demoFileId_key" ON "Match"("demoFileId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_steam64Id_key" ON "Player"("steam64Id");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayer_matchId_playerId_key" ON "MatchPlayer"("matchId", "playerId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_demoFileId_fkey" FOREIGN KEY ("demoFileId") REFERENCES "DemoFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
