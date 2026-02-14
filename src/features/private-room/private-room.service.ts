import { Injectable, Logger } from '@nestjs/common';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  OverwriteType,
  PermissionFlagsBits,
} from 'discord.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import {
  CATEGORY_NAME,
  CREATE_VOICE_NAME,
  INTERFACE_CHANNEL_NAME,
  MANAGEMENT_EMBED_COLOR,
  MANAGEMENT_EMBED_IMAGE_URL,
  MODAL_INPUT_IDS,
  MODAL_IDS,
  ROOM_BUTTONS,
} from './private-room.constants.js';

const VOICE_OWNER_ALLOW =
  PermissionFlagsBits.Connect |
  PermissionFlagsBits.Speak |
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.ManageChannels;
const VOICE_EVERYONE_CONNECT = PermissionFlagsBits.Connect | PermissionFlagsBits.ViewChannel;

@Injectable()
export class PrivateRoomService {
  private readonly logger = new Logger(PrivateRoomService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly client: Client,
  ) {}

  async ensureCategoryAndChannels(guildId: string): Promise<{
    categoryId: string;
    interfaceChannelId: string;
    createVoiceChannelId: string;
  }> {
    const guild = await this.client.guilds.fetch(guildId);
    if (!guild) throw new Error('Сервер не найден');
    await guild.channels.fetch();
    const cache = guild.channels.cache;
    let category = cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === CATEGORY_NAME,
    );
    if (!category) {
      category = await guild.channels.create({
        name: CATEGORY_NAME,
        type: ChannelType.GuildCategory,
      });
      this.logger.log(`Created category ${CATEGORY_NAME} in guild ${guildId}`);
    }
    let interfaceChannel = cache.find(
      (c) =>
        c.parentId === category!.id &&
        c.type === ChannelType.GuildText &&
        c.name === INTERFACE_CHANNEL_NAME,
    );
    if (!interfaceChannel) {
      interfaceChannel = await guild.channels.create({
        name: INTERFACE_CHANNEL_NAME,
        type: ChannelType.GuildText,
        parent: category.id,
      });
      this.logger.log(`Created channel ${INTERFACE_CHANNEL_NAME} in guild ${guildId}`);
    }
    let createVoice = cache.find(
      (c) =>
        c.parentId === category!.id &&
        c.type === ChannelType.GuildVoice &&
        c.name === CREATE_VOICE_NAME,
    );
    if (!createVoice) {
      createVoice = await guild.channels.create({
        name: CREATE_VOICE_NAME,
        type: ChannelType.GuildVoice,
        parent: category.id,
      });
      this.logger.log(`Created voice channel ${CREATE_VOICE_NAME} in guild ${guildId}`);
    }
    return {
      categoryId: category.id,
      interfaceChannelId: interfaceChannel.id,
      createVoiceChannelId: createVoice.id,
    };
  }

  async getOrSaveGuildConfig(
    guildId: string,
    categoryId: string,
    interfaceChannelId: string,
    createVoiceChannelId: string,
  ): Promise<{ id: string }> {
    const delegate = (this.prisma as any).guildRoomConfig;
    if (delegate?.upsert) {
      const row = await delegate.upsert({
        where: { guildId },
        create: { guildId, categoryId, interfaceChannelId, createVoiceChannelId },
        update: { categoryId, interfaceChannelId, createVoiceChannelId },
      });
      return { id: row.id };
    }
    const { randomUUID } = await import('node:crypto');
    const id = randomUUID();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "GuildRoomConfig" (id, "guildId", "categoryId", "interfaceChannelId", "createVoiceChannelId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT ("guildId") DO UPDATE SET "categoryId" = EXCLUDED."categoryId",
         "interfaceChannelId" = EXCLUDED."interfaceChannelId",
         "createVoiceChannelId" = EXCLUDED."createVoiceChannelId",
         "updatedAt" = NOW()`,
      id,
      guildId,
      categoryId,
      interfaceChannelId,
      createVoiceChannelId,
    );
    return { id };
  }

  async getGuildConfig(guildId: string): Promise<{
    categoryId: string;
    interfaceChannelId: string;
    createVoiceChannelId: string;
  } | null> {
    const delegate = (this.prisma as any).guildRoomConfig;
    if (delegate?.findUnique) {
      const row = await delegate.findUnique({ where: { guildId } });
      return row
        ? {
            categoryId: row.categoryId,
            interfaceChannelId: row.interfaceChannelId,
            createVoiceChannelId: row.createVoiceChannelId,
          }
        : null;
    }
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ categoryId: string; interfaceChannelId: string; createVoiceChannelId: string }>
    >(
      'SELECT "categoryId", "interfaceChannelId", "createVoiceChannelId" FROM "GuildRoomConfig" WHERE "guildId" = $1 LIMIT 1',
      guildId,
    );
    const row = rows[0];
    return row ?? null;
  }

  async getOrCreateUserByDiscordId(
    discordUserId: string,
    username?: string | null,
    globalName?: string | null,
    avatarUrl?: string | null,
  ): Promise<{ id: string }> {
    const delegate = (this.prisma as any).user;
    if (delegate?.upsert) {
      const row = await delegate.upsert({
        where: { discordUserId },
        create: { discordUserId, username: username ?? null, globalName: globalName ?? null, avatarUrl: avatarUrl ?? null },
        update: { username: username ?? undefined, globalName: globalName ?? undefined, avatarUrl: avatarUrl ?? undefined },
      });
      return { id: row.id };
    }
    const { randomUUID } = await import('node:crypto');
    const id = randomUUID();
    const r = await this.prisma.$queryRawUnsafe<
      Array<{ id: string }>
    >(
      `INSERT INTO "User" (id, "discordUserId", username, "globalName", "avatarUrl", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT ("discordUserId") DO UPDATE SET username = EXCLUDED.username, "globalName" = EXCLUDED."globalName", "avatarUrl" = EXCLUDED."avatarUrl", "updatedAt" = NOW()
       RETURNING id`,
      id,
      discordUserId,
      username ?? null,
      globalName ?? null,
      avatarUrl ?? null,
    );
    const row = r[0];
    if (!row) throw new Error('User upsert failed');
    return { id: row.id };
  }

  async createRoom(params: {
    guildId: string;
    categoryId: string;
    ownerDiscordId: string;
    ownerUsername?: string | null;
    ownerGlobalName?: string | null;
    ownerAvatarUrl?: string | null;
    roomName: string;
  }): Promise<{ roomId: string; voiceChannelId: string }> {
    const guild = await this.client.guilds.fetch(params.guildId);
    if (!guild) throw new Error('Сервер не найден');
    const owner = await this.getOrCreateUserByDiscordId(
      params.ownerDiscordId,
      params.ownerUsername,
      params.ownerGlobalName,
      params.ownerAvatarUrl,
    );
    const overwrites = [
      { id: params.guildId, type: OverwriteType.Role, deny: PermissionFlagsBits.Connect },
      { id: params.ownerDiscordId, type: OverwriteType.Member, allow: VOICE_OWNER_ALLOW },
    ];
    const voiceChannel = await guild.channels.create({
      name: params.roomName,
      type: ChannelType.GuildVoice,
      parent: params.categoryId,
      permissionOverwrites: overwrites,
    });
    const delegate = (this.prisma as any).privateRoom;
    let roomId: string;
    if (delegate?.create) {
      const row = await delegate.create({
        data: {
          guildId: params.guildId,
          voiceChannelId: voiceChannel.id,
          textChannelId: null,
          ownerId: owner.id,
        },
      });
      roomId = row.id;
    } else {
      const { randomUUID } = await import('node:crypto');
      roomId = randomUUID();
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "PrivateRoom" (id, "guildId", "voiceChannelId", "textChannelId", "ownerId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NULL, $4, NOW(), NOW())`,
        roomId,
        params.guildId,
        voiceChannel.id,
        owner.id,
      );
    }
    this.logger.log(`Created private room ${roomId} for ${params.ownerDiscordId} in guild ${params.guildId}`);
    return { roomId, voiceChannelId: voiceChannel.id };
  }

  async findRoomByTextChannelId(textChannelId: string): Promise<{
    id: string;
    guildId: string;
    voiceChannelId: string;
    ownerDiscordId: string;
  } | null> {
    const delegate = (this.prisma as any).privateRoom;
    if (delegate?.findFirst) {
      const row = await delegate.findFirst({
        where: { textChannelId },
        include: { owner: true },
      });
      return row ? { id: row.id, guildId: row.guildId, voiceChannelId: row.voiceChannelId, ownerDiscordId: row.owner.discordUserId } : null;
    }
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; guildId: string; voiceChannelId: string; discordUserId: string }>
    >(
      `SELECT r.id, r."guildId", r."voiceChannelId", u."discordUserId"
       FROM "PrivateRoom" r JOIN "User" u ON r."ownerId" = u.id WHERE r."textChannelId" = $1 LIMIT 1`,
      textChannelId,
    );
    const row = rows[0];
    return row ? { id: row.id, guildId: row.guildId, voiceChannelId: row.voiceChannelId, ownerDiscordId: row.discordUserId } : null;
  }

  async findRoomByVoiceChannelId(voiceChannelId: string): Promise<{
    id: string;
    guildId: string;
    textChannelId: string | null;
    ownerDiscordId: string;
  } | null> {
    const delegate = (this.prisma as any).privateRoom;
    if (delegate?.findFirst) {
      const row = await delegate.findFirst({
        where: { voiceChannelId },
        include: { owner: true },
      });
      return row ? { id: row.id, guildId: row.guildId, textChannelId: row.textChannelId, ownerDiscordId: row.owner.discordUserId } : null;
    }
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; guildId: string; textChannelId: string | null; discordUserId: string }>
    >(
      `SELECT r.id, r."guildId", r."textChannelId", u."discordUserId"
       FROM "PrivateRoom" r JOIN "User" u ON r."ownerId" = u.id WHERE r."voiceChannelId" = $1 LIMIT 1`,
      voiceChannelId,
    );
    const row = rows[0];
    return row ? { id: row.id, guildId: row.guildId, textChannelId: row.textChannelId, ownerDiscordId: row.discordUserId } : null;
  }

  async findRoomById(roomId: string): Promise<{
    id: string;
    guildId: string;
    voiceChannelId: string;
    textChannelId: string | null;
    ownerDiscordId: string;
  } | null> {
    const delegate = (this.prisma as any).privateRoom;
    if (delegate?.findUnique) {
      const row = await delegate.findUnique({
        where: { id: roomId },
        include: { owner: true },
      });
      return row ? { id: row.id, guildId: row.guildId, voiceChannelId: row.voiceChannelId, textChannelId: row.textChannelId, ownerDiscordId: row.owner.discordUserId } : null;
    }
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; guildId: string; voiceChannelId: string; textChannelId: string | null; discordUserId: string }>
    >(
      `SELECT r.id, r."guildId", r."voiceChannelId", r."textChannelId", u."discordUserId"
       FROM "PrivateRoom" r JOIN "User" u ON r."ownerId" = u.id WHERE r.id = $1 LIMIT 1`,
      roomId,
    );
    const row = rows[0];
    return row ? { id: row.id, guildId: row.guildId, voiceChannelId: row.voiceChannelId, textChannelId: row.textChannelId, ownerDiscordId: row.discordUserId } : null;
  }

  async isOwnerByRoomId(roomId: string, discordUserId: string): Promise<boolean> {
    const room = await this.findRoomById(roomId);
    return room?.ownerDiscordId === discordUserId;
  }

  async findActiveRoomByOwnerInGuild(guildId: string, ownerDiscordId: string): Promise<{
    id: string;
    voiceChannelId: string;
  } | null> {
    const delegate = (this.prisma as any).privateRoom;
    if (delegate?.findFirst) {
      const row = await delegate.findFirst({
        where: { guildId, owner: { discordUserId: ownerDiscordId } },
        select: { id: true, voiceChannelId: true },
      });
      return row ?? null;
    }
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; voiceChannelId: string }>
    >(
      `SELECT r.id, r."voiceChannelId" FROM "PrivateRoom" r
       JOIN "User" u ON r."ownerId" = u.id
       WHERE r."guildId" = $1 AND u."discordUserId" = $2 LIMIT 1`,
      guildId,
      ownerDiscordId,
    );
    const row = rows[0];
    return row ?? null;
  }

  async getVoiceChannelMemberCount(voiceChannelId: string): Promise<number> {
    const channel = await this.client.channels.fetch(voiceChannelId).catch(() => null);
    if (!channel || !channel.isVoiceBased()) return 0;
    return channel.members?.size ?? 0;
  }

  async isUserInRoomVoice(voiceChannelId: string, userId: string): Promise<boolean> {
    const channel = await this.client.channels.fetch(voiceChannelId).catch(() => null);
    if (!channel || !channel.isVoiceBased() || !channel.members) return false;
    return channel.members.has(userId);
  }

  async deleteRoom(roomId: string): Promise<void> {
    const room = await this.findRoomById(roomId);
    if (!room) return;
    const guild = await this.client.guilds.fetch(room.guildId).catch(() => null);
    if (guild) {
      const ids = [room.voiceChannelId];
      if (room.textChannelId) ids.push(room.textChannelId);
      for (const id of ids) {
        const ch = await guild.channels.fetch(id).catch(() => null);
        await ch?.delete().catch((e) => this.logger.warn(`Delete channel ${id}: ${e}`));
      }
    }
    const delegate = (this.prisma as any).privateRoom;
    try {
      if (delegate?.delete) await delegate.delete({ where: { id: roomId } });
      else await this.prisma.$executeRawUnsafe('DELETE FROM "PrivateRoom" WHERE id = $1', roomId);
      this.logger.log(`Deleted room ${roomId}`);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2025') return;
      throw e;
    }
  }

  async updateRoomName(roomId: string, name: string): Promise<void> {
    const room = await this.findRoomById(roomId);
    if (!room) throw new Error('Комната не найдена');
    const guild = await this.client.guilds.fetch(room.guildId);
    const voice = await guild.channels.fetch(room.voiceChannelId);
    if (voice && 'setName' in voice) await voice.setName(name);
    if (room.textChannelId) {
      const text = await guild.channels.fetch(room.textChannelId);
      if (text && 'setName' in text) await text.setName(`💬 ${name}`);
    }
  }

  async setRoomUserLimit(roomId: string, limit: number): Promise<void> {
    const room = await this.findRoomById(roomId);
    if (!room) throw new Error('Комната не найдена');
    const channel = await this.client.channels.fetch(room.voiceChannelId);
    if (channel && channel.isVoiceBased()) await channel.setUserLimit(Math.max(0, Math.min(99, limit)));
  }

  async setRoomClosed(roomId: string, closed: boolean): Promise<void> {
    const room = await this.findRoomById(roomId);
    if (!room) throw new Error('Комната не найдена');
    const channel = await this.client.channels.fetch(room.voiceChannelId);
    if (!channel || !channel.isVoiceBased()) return;
    const guild = await this.client.guilds.fetch(room.guildId);
    if (closed) {
      await channel.permissionOverwrites.edit(guild.id, { Connect: false });
    } else {
      await channel.permissionOverwrites.edit(guild.id, { Connect: true });
    }
  }

  async kickUserFromRoom(guildId: string, voiceChannelId: string, targetUserId: string): Promise<void> {
    const guild = await this.client.guilds.fetch(guildId);
    const member = await guild.members.fetch(targetUserId).catch(() => null);
    if (member?.voice?.channelId === voiceChannelId) await member.voice.disconnect();
  }

  async giveAccess(roomId: string, targetId: string, isUser: boolean): Promise<void> {
    const room = await this.findRoomById(roomId);
    if (!room) throw new Error('Комната не найдена');
    const channel = await this.client.channels.fetch(room.voiceChannelId);
    if (!channel || !channel.isVoiceBased() || !('permissionOverwrites' in channel)) return;
    await channel.permissionOverwrites.edit(targetId, { Connect: true, ViewChannel: true }, { type: isUser ? OverwriteType.Member : OverwriteType.Role });
  }

  async revokeAccess(roomId: string, targetId: string): Promise<void> {
    const room = await this.findRoomById(roomId);
    if (!room) throw new Error('Комната не найдена');
    const channel = await this.client.channels.fetch(room.voiceChannelId);
    if (!channel || !channel.isVoiceBased() || !('permissionOverwrites' in channel)) return;
    await channel.permissionOverwrites.edit(targetId, { Connect: false }, { type: OverwriteType.Member });
    const guild = await this.client.guilds.fetch(room.guildId);
    const member = await guild.members.fetch(targetId).catch(() => null);
    if (member?.voice?.channelId === room.voiceChannelId) await member.voice.disconnect();
  }

  async transferOwnership(roomId: string, newOwnerDiscordId: string): Promise<void> {
    const room = await this.findRoomById(roomId);
    if (!room) throw new Error('Комната не найдена');
    const newOwner = await this.getOrCreateUserByDiscordId(newOwnerDiscordId);
    const delegate = (this.prisma as any).privateRoom;
    if (delegate?.update) {
      await delegate.update({ where: { id: roomId }, data: { ownerId: newOwner.id } });
    } else {
      await this.prisma.$executeRawUnsafe('UPDATE "PrivateRoom" SET "ownerId" = $1, "updatedAt" = NOW() WHERE id = $2', newOwner.id, roomId);
    }
    const channel = await this.client.channels.fetch(room.voiceChannelId);
    if (!channel || !channel.isVoiceBased() || !('permissionOverwrites' in channel)) return;
    await channel.permissionOverwrites.delete(room.ownerDiscordId);
    await channel.permissionOverwrites.edit(newOwnerDiscordId, {
      Connect: true,
      Speak: true,
      ViewChannel: true,
      ManageChannels: true,
    }, { type: OverwriteType.Member });
  }

  async moveMemberToVoice(guildId: string, userId: string, voiceChannelId: string): Promise<boolean> {
    const guild = await this.client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return false;
    const channel = await guild.channels.fetch(voiceChannelId).catch(() => null);
    if (!channel || !channel.isVoiceBased()) return false;
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member?.voice) return false;
    try {
      await member.voice.setChannel(channel);
      return true;
    } catch (e) {
      this.logger.warn(`moveMemberToVoice failed: ${e}`);
      return false;
    }
  }

  getRoomManagementEmbed(): { title: string; description: string; color: number; imageUrl: string } {
    return {
      title: '⚙️ Управление приватным каналом',
      description: 'Настройте свою комнату, используя кнопки ниже. Все изменения применяются мгновенно.',
      color: MANAGEMENT_EMBED_COLOR,
      imageUrl: MANAGEMENT_EMBED_IMAGE_URL,
    };
  }

  getModalIds() {
    return { rename: MODAL_IDS.RENAME, limit: MODAL_IDS.LIMIT };
  }

  getModalInputIds() {
    return MODAL_INPUT_IDS;
  }

  async sendPermanentManagementMessage(managementChannelId: string): Promise<string> {
    const channel = await this.client.channels.fetch(managementChannelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) throw new Error('Канал не найден');
    const textChannel = channel as import('discord.js').TextChannel;
    const embed = this.getRoomManagementEmbed();
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(ROOM_BUTTONS.RENAME).setLabel('Название').setEmoji('📝').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(ROOM_BUTTONS.LIMIT).setLabel('Лимит').setEmoji('🔢').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(ROOM_BUTTONS.OPEN).setLabel('Открыть').setEmoji('🔓').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(ROOM_BUTTONS.CLOSE).setLabel('Закрыть').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    );
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(ROOM_BUTTONS.GIVE_ACCESS).setLabel('Доступ').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(ROOM_BUTTONS.REVOKE_ACCESS).setLabel('Забрать').setEmoji('❌').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(ROOM_BUTTONS.KICK).setLabel('Выгнать').setEmoji('👢').setStyle(ButtonStyle.Danger),
    );
    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(ROOM_BUTTONS.TRANSFER).setLabel('Передать').setEmoji('👑').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(ROOM_BUTTONS.DELETE).setLabel('Удалить').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    );
    const messages = await textChannel.messages.fetch({ limit: 20 });
    for (const msg of messages.values()) {
      if (msg.author?.id !== this.client.user?.id) continue;
      const emb = msg.embeds[0];
      if (emb?.title === embed.title) await msg.delete().catch(() => {});
    }
    const embedMsg = new EmbedBuilder()
      .setTitle(embed.title)
      .setDescription(embed.description)
      .setColor(embed.color)
      .setImage(embed.imageUrl);
    const msg = await textChannel.send({
      embeds: [embedMsg],
      components: [row1, row2, row3],
    });
    return msg.id;
  }
}
