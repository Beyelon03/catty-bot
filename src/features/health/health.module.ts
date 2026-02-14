import { Module } from '@nestjs/common';
import { CheckDbUseCase } from './application/check-db.use-case.js';
import { CheckDiscordUseCase } from './application/check-discord.use-case.js';
import { DB_PING_REPOSITORY } from './domain/db-ping.repository.js';
import { DISCORD_READY_PORT } from './domain/discord-ready.port.js';
import { NecordDiscordReadyAdapter } from './infrastructure/necord-discord-ready.adapter.js';
import { PrismaDbPingRepository } from './infrastructure/prisma-db-ping.repository.js';
import { DiscordModule } from '../../shared/discord/discord.module.js';
import { PrismaModule } from '../../shared/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, DiscordModule],
  providers: [
    CheckDbUseCase,
    CheckDiscordUseCase,
    {
      provide: DB_PING_REPOSITORY,
      useClass: PrismaDbPingRepository,
    },
    {
      provide: DISCORD_READY_PORT,
      useClass: NecordDiscordReadyAdapter,
    },
  ],
  exports: [CheckDbUseCase, CheckDiscordUseCase],
})
export class HealthModule {}
