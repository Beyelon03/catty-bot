import { Inject, Injectable } from '@nestjs/common';
import type { IDiscordReadyPort } from '../domain/discord-ready.port.js';
import { DISCORD_READY_PORT } from '../domain/discord-ready.port.js';

@Injectable()
export class CheckDiscordUseCase {
  constructor(
    @Inject(DISCORD_READY_PORT)
    private readonly discord: IDiscordReadyPort,
  ) {}

  execute(): { ok: boolean } {
    return { ok: this.discord.isReady() };
  }
}
