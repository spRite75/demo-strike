-- CreateTable
CREATE TABLE "LocalUser" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "LocalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "filepath" TEXT NOT NULL,
    "parsed" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalUser_username_key" ON "LocalUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "File_filepath_key" ON "File"("filepath");
