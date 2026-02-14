-- CreateTable
CREATE TABLE "GuildRoomConfig" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "interfaceChannelId" TEXT NOT NULL,
    "interfaceMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildRoomConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateRoom" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "voiceChannelId" TEXT NOT NULL,
    "textChannelId" TEXT,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuildRoomConfig_guildId_key" ON "GuildRoomConfig"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateRoom_voiceChannelId_key" ON "PrivateRoom"("voiceChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateRoom_textChannelId_key" ON "PrivateRoom"("textChannelId");

-- CreateIndex
CREATE INDEX "PrivateRoom_guildId_ownerId_idx" ON "PrivateRoom"("guildId", "ownerId");

-- CreateIndex
CREATE INDEX "PrivateRoom_guildId_idx" ON "PrivateRoom"("guildId");
