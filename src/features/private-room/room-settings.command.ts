import { SlashCommand, Ctx } from 'necord';
import type { SlashCommandContext } from 'necord';
import { Injectable } from '@nestjs/common';
import { PermissionFlagsBits } from 'discord.js';
import { PrivateRoomService } from './private-room.service.js';

@Injectable()
export class RoomSettingsCommand {
  constructor(private readonly roomService: PrivateRoomService) {}

  @SlashCommand({
    name: 'room-settings',
    description: 'Создать категорию и каналы для приватных комнат (только для администраторов)',
  })
  async roomSettings(@Ctx() [interaction]: SlashCommandContext) {
    const member = interaction.member;
    const hasAdmin = member && 'permissions' in member
      && typeof (member.permissions as { has?: (x: bigint) => boolean }).has === 'function'
      && (member.permissions as { has: (x: bigint) => boolean }).has(PermissionFlagsBits.Administrator);
    if (!hasAdmin) {
      await interaction.reply({
        content: 'Недостаточно прав. Команда только для администраторов сервера.',
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.editReply({ content: 'Доступно только на сервере.' });
      return;
    }
    try {
      const { categoryId, interfaceChannelId, createVoiceChannelId } =
        await this.roomService.ensureCategoryAndChannels(guildId);
      await this.roomService.getOrSaveGuildConfig(
        guildId,
        categoryId,
        interfaceChannelId,
        createVoiceChannelId,
      );
      await this.roomService.sendPermanentManagementMessage(interfaceChannelId);
      await interaction.editReply({
        content: `Готово. В канале «управление» появился блок с кнопками. Зайдите в «➕ Создать», чтобы создать свою комнату.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка настройки';
      await interaction.editReply({ content: `❌ ${msg}` });
    }
  }
}
