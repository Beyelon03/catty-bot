import { Injectable } from '@nestjs/common';
import type {
  GuildMemberData,
  IGuildMemberRepository,
} from '../domain/guild-member.repository.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';

@Injectable()
export class PrismaGuildMemberRepository implements IGuildMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertUserInGuild(data: {
    userId: string;
    guildId: string;
    lastSeenAt?: Date | null;
  }): Promise<GuildMemberData> {
    const delegate = (this.prisma as any).guildMember;
    if (delegate?.upsert) {
      const row = await delegate.upsert({
        where: {
          userId_guildId: { userId: data.userId, guildId: data.guildId },
        },
        create: {
          userId: data.userId,
          guildId: data.guildId,
          lastSeenAt: data.lastSeenAt ?? null,
        },
        update: {
          lastSeenAt: data.lastSeenAt ?? undefined,
          updatedAt: new Date(),
        },
      });
      return this.toGuildMemberData(row);
    }
    const { randomUUID } = await import('node:crypto');
    const id = randomUUID();
    const lastSeen = data.lastSeenAt ?? new Date();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "GuildMember" (id, "userId", "guildId", "lastSeenAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT ("userId", "guildId") DO UPDATE SET
         "lastSeenAt" = EXCLUDED."lastSeenAt",
         "updatedAt" = NOW()`,
      id,
      data.userId,
      data.guildId,
      lastSeen,
    );
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        userId: string;
        guildId: string;
        lastSeenAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }>
    >(
      'SELECT id, "userId", "guildId", "lastSeenAt", "createdAt", "updatedAt" FROM "GuildMember" WHERE "userId" = $1 AND "guildId" = $2 LIMIT 1',
      data.userId,
      data.guildId,
    );
    const row = rows[0];
    if (!row) throw new Error('GuildMember upsert failed');
    return this.toGuildMemberData(row);
  }

  private toGuildMemberData(row: {
    id: string;
    userId: string;
    guildId: string;
    lastSeenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): GuildMemberData {
    return {
      id: row.id,
      userId: row.userId,
      guildId: row.guildId,
      lastSeenAt: row.lastSeenAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
