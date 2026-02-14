import { Injectable } from '@nestjs/common';
import type { IDbPingRepository } from '../domain/db-ping.repository.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';

@Injectable()
export class PrismaDbPingRepository implements IDbPingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
