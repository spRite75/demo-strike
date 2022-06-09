-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "steam64Id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "demoCount" INTEGER NOT NULL,
    "lastPlayed" TIMESTAMP(3) NOT NULL,
    "steamProfileUrl" TEXT,
    "steamAvatarUrlDefault" TEXT,
    "steamAvatarUrlMedium" TEXT,
    "steamAvatarUrlFull" TEXT,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_steam64Id_key" ON "Player"("steam64Id");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");
