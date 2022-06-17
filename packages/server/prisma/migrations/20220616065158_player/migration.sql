-- AlterTable
ALTER TABLE "MatchPlayer" ADD COLUMN     "playerId" INTEGER;

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

-- CreateIndex
CREATE UNIQUE INDEX "Player_steam64Id_key" ON "Player"("steam64Id");

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
