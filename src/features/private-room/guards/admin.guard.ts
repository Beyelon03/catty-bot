import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { GuildMember } from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const [interaction] = context.getArgs() as [{
      member?: GuildMember | null;
    }];
    const member = interaction?.member;
    if (!member || !('permissions' in member)) return false;
    return member.permissions.has(PermissionFlagsBits.Administrator);
  }
}
