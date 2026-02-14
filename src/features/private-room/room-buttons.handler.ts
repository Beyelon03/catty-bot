import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
} from 'discord.js';
import { Button, Ctx } from 'necord';
import type { ButtonContext } from 'necord';
import { Injectable } from '@nestjs/common';
import { MODAL_IDS, MODAL_INPUT_IDS, ROOM_BUTTONS } from './private-room.constants.js';
import { PrivateRoomService } from './private-room.service.js';

const FORBIDDEN_MSG = 'Только владелец комнаты может это сделать.';
const NO_VOICE_MSG = 'Зайдите в голосовой канал вашей приватной комнаты.';

@Injectable()
export class RoomButtonsHandler {
  constructor(private readonly roomService: PrivateRoomService) {}

  private async getRoomIdFromVoice(interaction: ButtonContext[0]): Promise<string | null> {
    const channelId = interaction.member && 'voice' in interaction.member ? (interaction.member as { voice?: { channelId?: string | null } }).voice?.channelId : null;
    if (!channelId) return null;
    const room = await this.roomService.findRoomByVoiceChannelId(channelId);
    return room?.id ?? null;
  }

  private async canManage(interaction: ButtonContext[0], roomId: string): Promise<boolean> {
    const userId = interaction.user?.id;
    if (!userId) return false;
    return this.roomService.isOwnerByRoomId(roomId, userId);
  }

  @Button(ROOM_BUTTONS.RENAME)
  async rename(@Ctx() [interaction]: ButtonContext) {
    const roomId = await this.getRoomIdFromVoice(interaction);
    if (!roomId) {
      await interaction.reply({ content: NO_VOICE_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    await interaction.showModal(
        new ModalBuilder()
        .setCustomId(`${MODAL_IDS.RENAME}/${roomId}`)
        .setTitle('Название комнаты')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId(MODAL_INPUT_IDS.RENAME_NAME)
              .setLabel('Название')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(100),
          ),
        ),
    );
  }

  @Button(ROOM_BUTTONS.LIMIT)
  async limit(@Ctx() [interaction]: ButtonContext) {
    const roomId = await this.getRoomIdFromVoice(interaction);
    if (!roomId) {
      await interaction.reply({ content: NO_VOICE_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    await interaction.showModal(
        new ModalBuilder()
        .setCustomId(`${MODAL_IDS.LIMIT}/${roomId}`)
        .setTitle('Лимит участников (0–99)')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId(MODAL_INPUT_IDS.LIMIT_VALUE)
              .setLabel('Лимит')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setPlaceholder('0'),
          ),
        ),
    );
  }

  @Button(ROOM_BUTTONS.CLOSE)
  async close(@Ctx() [interaction]: ButtonContext) {
    const roomId = await this.getRoomIdFromVoice(interaction);
    if (!roomId) {
      await interaction.reply({ content: NO_VOICE_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    await interaction.deferUpdate();
    try {
      await this.roomService.setRoomClosed(roomId, true);
      await interaction.followUp({ content: 'Комната закрыта для входа.', ephemeral: true });
    } catch {
      await interaction.followUp({ content: 'Ошибка.', ephemeral: true }).catch(() => {});
    }
  }

  @Button(ROOM_BUTTONS.OPEN)
  async open(@Ctx() [interaction]: ButtonContext) {
    const roomId = await this.getRoomIdFromVoice(interaction);
    if (!roomId) {
      await interaction.reply({ content: NO_VOICE_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    await interaction.deferUpdate();
    try {
      await this.roomService.setRoomClosed(roomId, false);
      await interaction.followUp({ content: 'Комната открыта для входа.', ephemeral: true });
    } catch {
      await interaction.followUp({ content: 'Ошибка.', ephemeral: true }).catch(() => {});
    }
  }

  @Button(ROOM_BUTTONS.KICK)
  async kick(@Ctx() [interaction]: ButtonContext) {
    const roomId = await this.getRoomIdFromVoice(interaction);
    if (!roomId) {
      await interaction.reply({ content: NO_VOICE_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    const room = await this.roomService.findRoomById(roomId);
    if (!room) {
      await interaction.editReply({ content: 'Комната не найдена.' });
      return;
    }
    const channel = await interaction.guild?.channels.fetch(room.voiceChannelId);
    if (!channel || !channel.isVoiceBased()) {
      await interaction.editReply({ content: 'Канал не найден.' });
      return;
    }
    const members = Array.from(channel.members.values()).filter((m) => m.id !== interaction.user?.id);
    if (members.length === 0) {
      await interaction.editReply({ content: 'В комнате никого нет.' });
      return;
    }
    const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`room_select_kick/${roomId}`)
        .setPlaceholder('Выберите участника')
        .setMinValues(1)
        .setMaxValues(1),
    );
    await interaction.editReply({
      content: '**Только вам видно** — выберите участника ниже:',
      components: [row],
    });
  }

  @Button(ROOM_BUTTONS.GIVE_ACCESS)
  async giveAccess(@Ctx() [interaction]: ButtonContext) {
    const roomId = await this.getRoomIdFromVoice(interaction);
    if (!roomId) {
      await interaction.reply({ content: NO_VOICE_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`room_select_give/${roomId}`)
        .setPlaceholder('Выдать доступ')
        .setMinValues(1)
        .setMaxValues(1),
    );
    await interaction.reply({
      content: '**Только вам видно** — выберите пользователя ниже:',
      components: [row],
      ephemeral: true,
    });
  }

  @Button(ROOM_BUTTONS.REVOKE_ACCESS)
  async revokeAccess(@Ctx() [interaction]: ButtonContext) {
    const roomId = await this.getRoomIdFromVoice(interaction);
    if (!roomId) {
      await interaction.reply({ content: NO_VOICE_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`room_select_revoke/${roomId}`)
        .setPlaceholder('Забрать доступ')
        .setMinValues(1)
        .setMaxValues(1),
    );
    await interaction.reply({
      content: '**Только вам видно** — выберите пользователя ниже:',
      components: [row],
      ephemeral: true,
    });
  }

  @Button(ROOM_BUTTONS.TRANSFER)
  async transfer(@Ctx() [interaction]: ButtonContext) {
    const roomId = await this.getRoomIdFromVoice(interaction);
    if (!roomId) {
      await interaction.reply({ content: NO_VOICE_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    const room = await this.roomService.findRoomById(roomId);
    if (!room) {
      await interaction.editReply({ content: 'Комната не найдена.' });
      return;
    }
    const channel = await interaction.guild?.channels.fetch(room.voiceChannelId);
    if (!channel || !channel.isVoiceBased()) {
      await interaction.editReply({ content: 'Канал не найден.' });
      return;
    }
    const members = Array.from(channel.members.values()).filter((m) => m.id !== room.ownerDiscordId);
    if (members.length === 0) {
      await interaction.editReply({ content: 'В комнате нет других участников для передачи.' });
      return;
    }
    const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(`room_select_transfer/${roomId}`)
        .setPlaceholder('Новый владелец')
        .setMinValues(1)
        .setMaxValues(1),
    );
    await interaction.editReply({
      content: '**Только вам видно** — выберите нового владельца ниже:',
      components: [row],
    });
  }

  @Button(ROOM_BUTTONS.DELETE)
  async delete(@Ctx() [interaction]: ButtonContext) {
    const roomId = await this.getRoomIdFromVoice(interaction);
    if (!roomId) {
      await interaction.reply({ content: NO_VOICE_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    await interaction.deferUpdate();
    try {
      await this.roomService.deleteRoom(roomId);
      await interaction.followUp({ content: 'Комната удалена.', ephemeral: true });
    } catch {
      await interaction.followUp({ content: 'Ошибка удаления.', ephemeral: true }).catch(() => {});
    }
  }
}
