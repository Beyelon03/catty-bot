import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { GuildMember } from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';
import { PrivateRoomService } from '../private-room.service.js';

@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  constructor(private readonly roomService: PrivateRoomService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const [interaction] = context.getArgs() as [
      { guildId: string | null; user: { id: string }; member?: GuildMember | null },
    ];
    const guildId = interaction?.guildId;
    const userId = interaction?.user?.id;
    if (!guildId || !userId) return false;
    const member = interaction.member;
    if (member && 'permissions' in member && member.permissions.has(PermissionFlagsBits.Administrator))
      return true;
    const roomId = this.getRoomIdFromInteraction(interaction);
    if (!roomId) return false;
    const isOwner = await this.roomService.isOwnerByRoomId(roomId, userId);
    return isOwner;
  }

  private getRoomIdFromInteraction(interaction: unknown): string | null {
    const i = interaction as { customId?: string };
    const id = i?.customId ?? (i as { message?: { interaction?: { customId?: string } } })?.message?.interaction?.customId;
    if (typeof id !== 'string') return null;
    const parts = id.split(/[/:]/);
    return parts.length >= 2 ? parts[1]! : null;
  }
}
