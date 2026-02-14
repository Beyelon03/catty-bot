-- AlterTable
ALTER TABLE "PrivateRoom" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "discordUserId" TEXT NOT NULL,
    "username" TEXT,
    "globalName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_discordUserId_key" ON "User"("discordUserId");

-- CreateIndex
CREATE INDEX "User_discordUserId_idx" ON "User"("discordUserId");

-- CreateIndex
CREATE INDEX "PrivateRoom_userId_idx" ON "PrivateRoom"("userId");

-- AddForeignKey
ALTER TABLE "PrivateRoom" ADD CONSTRAINT "PrivateRoom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
