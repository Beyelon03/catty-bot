import { Controller, Get } from '@nestjs/common';
import { CheckDbUseCase } from './features/health/application/check-db.use-case.js';
import { CheckDiscordUseCase } from './features/health/application/check-discord.use-case.js';

@Controller()
export class AppController {
  constructor(
    private readonly checkDbUseCase: CheckDbUseCase,
    private readonly checkDiscordUseCase: CheckDiscordUseCase,
  ) {}

  @Get()
  getStatus(): { status: string } {
    return { status: 'ok' };
  }

  @Get('health')
  async getHealth(): Promise<{ db: boolean; discord: boolean }> {
    const [db, discord] = await Promise.all([
      this.checkDbUseCase.execute().then((r) => r.ok).catch(() => false),
      Promise.resolve(this.checkDiscordUseCase.execute().ok),
    ]);
    return { db, discord };
  }

  @Get('health/db')
  async checkDb(): Promise<{ ok: boolean }> {
    return this.checkDbUseCase.execute();
  }

  @Get('health/discord')
  checkDiscord(): { ok: boolean } {
    return this.checkDiscordUseCase.execute();
  }
}
