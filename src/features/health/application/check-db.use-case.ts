import { Inject, Injectable } from '@nestjs/common';
import type { IDbPingRepository } from '../domain/db-ping.repository.js';
import { DB_PING_REPOSITORY } from '../domain/db-ping.repository.js';

@Injectable()
export class CheckDbUseCase {
  constructor(
    @Inject(DB_PING_REPOSITORY)
    private readonly db: IDbPingRepository,
  ) {}

  async execute(): Promise<{ ok: boolean }> {
    await this.db.ping();
    return { ok: true };
  }
}
