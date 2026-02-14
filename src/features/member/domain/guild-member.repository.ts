export const GUILD_MEMBER_REPOSITORY = Symbol('GUILD_MEMBER_REPOSITORY');

export interface GuildMemberData {
  id: string;
  userId: string;
  guildId: string;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGuildMemberRepository {
  upsertUserInGuild(data: {
    userId: string;
    guildId: string;
    lastSeenAt?: Date | null;
  }): Promise<GuildMemberData>;
}
