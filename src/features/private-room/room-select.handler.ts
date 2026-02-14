import type { Collection } from 'discord.js';
import type { User } from 'discord.js';
import { Ctx, UserSelect, ComponentParam, SelectedUsers } from 'necord';
import type { UserSelectContext } from 'necord';
import { Injectable } from '@nestjs/common';
import { SELECT_IDS } from './private-room.constants.js';
import { PrivateRoomService } from './private-room.service.js';

const FORBIDDEN_MSG = 'Только владелец комнаты может это сделать.';

@Injectable()
export class RoomSelectHandler {
  constructor(private readonly roomService: PrivateRoomService) {}

  private async canManage(interaction: UserSelectContext[0], roomId: string): Promise<boolean> {
    const userId = interaction.user?.id;
    if (!userId) return false;
    return this.roomService.isOwnerByRoomId(roomId, userId);
  }

  @UserSelect(`${SELECT_IDS.KICK}/:roomId`)
  async handleKick(
    @Ctx() [interaction]: UserSelectContext,
    @ComponentParam('roomId') roomId: string,
    @SelectedUsers() users: Collection<string, User>,
  ) {
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    const room = await this.roomService.findRoomById(roomId);
    if (!room) {
      await interaction.reply({ content: 'Комната не найдена или уже удалена.', ephemeral: true }).catch(() => {});
      return;
    }
    const target = users.first();
    if (!target) return;
    if (target.id === interaction.user?.id) {
      await interaction.reply({ content: 'Нельзя выгнать себя из комнаты.', ephemeral: true }).catch(() => {});
      return;
    }
    await interaction.deferUpdate();
    await this.roomService.kickUserFromRoom(room.guildId, room.voiceChannelId, target.id);
    await interaction.followUp({ content: 'Участник отключён от комнаты.', ephemeral: true }).catch(() => {});
  }

  @UserSelect(`${SELECT_IDS.GIVE_ACCESS}/:roomId`)
  async handleGive(
    @Ctx() [interaction]: UserSelectContext,
    @ComponentParam('roomId') roomId: string,
    @SelectedUsers() users: Collection<string, User>,
  ) {
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    const room = await this.roomService.findRoomById(roomId);
    if (!room) {
      await interaction.reply({ content: 'Комната не найдена или уже удалена.', ephemeral: true }).catch(() => {});
      return;
    }
    const target = users.first();
    if (!target) return;
    if (target.id === interaction.user?.id) {
      await interaction.reply({ content: 'Нельзя выдать доступ себе.', ephemeral: true }).catch(() => {});
      return;
    }
    await interaction.deferUpdate();
    await this.roomService.giveAccess(roomId, target.id, true);
    await interaction.followUp({ content: 'Доступ выдан.', ephemeral: true }).catch(() => {});
  }

  @UserSelect(`${SELECT_IDS.REVOKE_ACCESS}/:roomId`)
  async handleRevoke(
    @Ctx() [interaction]: UserSelectContext,
    @ComponentParam('roomId') roomId: string,
    @SelectedUsers() users: Collection<string, User>,
  ) {
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    const room = await this.roomService.findRoomById(roomId);
    if (!room) {
      await interaction.reply({ content: 'Комната не найдена или уже удалена.', ephemeral: true }).catch(() => {});
      return;
    }
    const target = users.first();
    if (!target) return;
    if (target.id === interaction.user?.id) {
      await interaction.reply({ content: 'Нельзя забрать доступ у себя.', ephemeral: true }).catch(() => {});
      return;
    }
    await interaction.deferUpdate();
    await this.roomService.revokeAccess(roomId, target.id);
    await interaction.followUp({ content: 'Доступ отозван.', ephemeral: true }).catch(() => {});
  }

  @UserSelect(`${SELECT_IDS.TRANSFER}/:roomId`)
  async handleTransfer(
    @Ctx() [interaction]: UserSelectContext,
    @ComponentParam('roomId') roomId: string,
    @SelectedUsers() users: Collection<string, User>,
  ) {
    if (!(await this.canManage(interaction, roomId))) {
      await interaction.reply({ content: FORBIDDEN_MSG, ephemeral: true }).catch(() => {});
      return;
    }
    const room = await this.roomService.findRoomById(roomId);
    if (!room) {
      await interaction.reply({ content: 'Комната не найдена или уже удалена.', ephemeral: true }).catch(() => {});
      return;
    }
    const target = users.first();
    if (!target) return;
    if (target.id === interaction.user?.id) {
      await interaction.reply({ content: 'Нельзя передать владение себе.', ephemeral: true }).catch(() => {});
      return;
    }
    const isInRoom = await this.roomService.isUserInRoomVoice(room.voiceChannelId, target.id);
    if (!isInRoom) {
      await interaction.reply({ content: 'Выберите участника, который сейчас в комнате.', ephemeral: true }).catch(() => {});
      return;
    }
    await interaction.deferUpdate();
    await this.roomService.transferOwnership(roomId, target.id);
    await interaction.followUp({ content: 'Владение передано. Новый владелец получил полный доступ к комнате.', ephemeral: true }).catch(() => {});
  }
}
