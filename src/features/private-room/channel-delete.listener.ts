import { Injectable } from '@nestjs/common';
import { On, Ctx } from 'necord';
import type { ContextOf } from 'necord';
import { PrivateRoomService } from './private-room.service.js';

@Injectable()
export class ChannelDeleteListener {
  constructor(private readonly roomService: PrivateRoomService) {}

  @On('channelDelete')
  async handle(@Ctx() [channel]: ContextOf<'channelDelete'>): Promise<void> {
    if (channel.isVoiceBased()) {
      const room = await this.roomService.findRoomByVoiceChannelId(channel.id);
      if (room) await this.roomService.deleteRoom(room.id);
      return;
    }
    const room = await this.roomService.findRoomByTextChannelId(channel.id);
    if (room) await this.roomService.deleteRoom(room.id);
  }
}
