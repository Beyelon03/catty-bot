import { Injectable } from '@nestjs/common';
import { On, Ctx } from 'necord';
import type { ContextOf } from 'necord';
import { RecordMemberInGuildUseCase } from '../application/record-member-in-guild.use-case.js';

@Injectable()
export class GuildMemberAddListener {
  constructor(
    private readonly recordMemberInGuild: RecordMemberInGuildUseCase,
  ) {}

  @On('guildMemberAdd')
  async handle(@Ctx() [member]: ContextOf<'guildMemberAdd'>): Promise<void> {
    const guildId = member.guild?.id;
    if (!guildId || !member.user) return;
    this.recordMemberInGuild
      .execute({
        guildId,
        discordUserId: member.user.id,
        username: member.user.username ?? null,
        globalName: member.user.globalName ?? null,
        avatarUrl: member.user.displayAvatarURL({ size: 128 }),
      })
      .catch(() => {});
  }
}
