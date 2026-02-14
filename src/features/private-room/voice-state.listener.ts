import { Injectable, Logger } from '@nestjs/common';
import { On, Ctx } from 'necord';
import type { ContextOf } from 'necord';
import { PrivateRoomService } from './private-room.service.js';

@Injectable()
export class VoiceStateListener {
  private readonly logger = new Logger(VoiceStateListener.name);

  constructor(private readonly roomService: PrivateRoomService) {}

  @On('voiceStateUpdate')
  async handle(
    @Ctx() [oldState, newState]: ContextOf<'voiceStateUpdate'>,
  ): Promise<void> {
    const guildId = newState.guild?.id;
    if (!guildId) return;

    const config = await this.roomService.getGuildConfig(guildId);
    if (!config) return;

    if (newState.channelId === config.createVoiceChannelId) {
      await this.handleJoinCreate(newState, config);
      return;
    }

    if (oldState.channelId && !newState.channelId) {
      await this.handleChannelEmpty(oldState.channelId);
      return;
    }
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      await this.handleChannelEmpty(oldState.channelId);
    }
  }

  private async handleJoinCreate(
    newState: NonNullable<ContextOf<'voiceStateUpdate'>[1]>,
    config: { categoryId: string; interfaceChannelId: string; createVoiceChannelId: string },
  ): Promise<void> {
    const guildId = newState.guild?.id;
    const member = newState.member;
    if (!guildId || !member?.user) return;
    const existingRoom = await this.roomService.findActiveRoomByOwnerInGuild(guildId, member.user.id);
    if (existingRoom) {
      const moved = await this.roomService.moveMemberToVoice(guildId, member.user.id, existingRoom.voiceChannelId);
      if (moved) return;
      await this.roomService.deleteRoom(existingRoom.id);
    }
    const name =
      `Комната ${member.user.globalName || member.user.username || 'Пользователя'}`.trim();
    try {
      const { voiceChannelId } =
        await this.roomService.createRoom({
          guildId,
          categoryId: config.categoryId,
          ownerDiscordId: member.user.id,
          ownerUsername: member.user.username ?? null,
          ownerGlobalName: member.user.globalName ?? null,
          ownerAvatarUrl: member.user.displayAvatarURL({ size: 128 }),
          roomName: name,
        });
      await this.roomService.moveMemberToVoice(
        guildId,
        member.user.id,
        voiceChannelId,
      );
    } catch (err) {
      this.logger.warn(`Create room failed: ${err}`);
    }
  }

  private async handleChannelEmpty(voiceChannelId: string): Promise<void> {
    const room = await this.roomService.findRoomByVoiceChannelId(voiceChannelId);
    if (!room) return;
    const count = await this.roomService.getVoiceChannelMemberCount(voiceChannelId);
    if (count === 0) await this.roomService.deleteRoom(room.id);
  }
}
