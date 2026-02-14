import { Inject, Injectable } from '@nestjs/common';
import type { IGuildMemberRepository } from '../domain/guild-member.repository.js';
import type { IUserRepository } from '../domain/user.repository.js';
import { GUILD_MEMBER_REPOSITORY } from '../domain/guild-member.repository.js';
import { USER_REPOSITORY } from '../domain/user.repository.js';

export interface RecordMemberInGuildInput {
  guildId: string;
  discordUserId: string;
  username?: string | null;
  globalName?: string | null;
  avatarUrl?: string | null;
}

@Injectable()
export class RecordMemberInGuildUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(GUILD_MEMBER_REPOSITORY) private readonly guildMemberRepo: IGuildMemberRepository,
  ) {}

  async execute(input: RecordMemberInGuildInput): Promise<void> {
    const user = await this.userRepo.upsertByDiscordId({
      discordUserId: input.discordUserId,
      username: input.username ?? null,
      globalName: input.globalName ?? null,
      avatarUrl: input.avatarUrl ?? null,
    });
    const now = new Date();
    await this.guildMemberRepo.upsertUserInGuild({
      userId: user.id,
      guildId: input.guildId,
      lastSeenAt: now,
    });
  }
}
