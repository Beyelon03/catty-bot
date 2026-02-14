export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserData {
  id: string;
  discordUserId: string;
  username: string | null;
  globalName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRepository {
  upsertByDiscordId(data: {
    discordUserId: string;
    username?: string | null;
    globalName?: string | null;
    avatarUrl?: string | null;
  }): Promise<UserData>;
}
