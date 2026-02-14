import { Injectable } from '@nestjs/common';
import type { IUserRepository, UserData } from '../domain/user.repository.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertByDiscordId(data: {
    discordUserId: string;
    username?: string | null;
    globalName?: string | null;
    avatarUrl?: string | null;
  }): Promise<UserData> {
    const delegate = (this.prisma as any).user;
    if (delegate?.upsert) {
      const row = await delegate.upsert({
        where: { discordUserId: data.discordUserId },
        create: {
          discordUserId: data.discordUserId,
          username: data.username ?? null,
          globalName: data.globalName ?? null,
          avatarUrl: data.avatarUrl ?? null,
        },
        update: {
          username: data.username ?? undefined,
          globalName: data.globalName ?? undefined,
          avatarUrl: data.avatarUrl ?? undefined,
        },
      });
      return this.toUserData(row);
    }
    const { randomUUID } = await import('node:crypto');
    const id = randomUUID();
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        discordUserId: string;
        username: string | null;
        globalName: string | null;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>
    >(
      `INSERT INTO "User" (id, "discordUserId", username, "globalName", "avatarUrl", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT ("discordUserId") DO UPDATE SET
         username = EXCLUDED.username,
         "globalName" = EXCLUDED."globalName",
         "avatarUrl" = EXCLUDED."avatarUrl",
         "updatedAt" = NOW()
       RETURNING id, "discordUserId", username, "globalName", "avatarUrl", "createdAt", "updatedAt"`,
      id,
      data.discordUserId,
      data.username ?? null,
      data.globalName ?? null,
      data.avatarUrl ?? null,
    );
    const row = rows[0];
    if (!row) throw new Error('User upsert failed');
    return this.toUserData(row);
  }

  private toUserData(row: {
    id: string;
    discordUserId: string;
    username: string | null;
    globalName: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserData {
    return {
      id: row.id,
      discordUserId: row.discordUserId,
      username: row.username,
      globalName: row.globalName,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
