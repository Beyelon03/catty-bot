import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from 'discord.js';

@Injectable()
export class DiscordClientErrorHandler implements OnModuleInit {
  private readonly logger = new Logger(DiscordClientErrorHandler.name);

  constructor(private readonly client: Client) {}

  onModuleInit(): void {
    this.client.on('error', (err: Error) => {
      this.logger.warn(
        err instanceof Error ? err.message : String(err),
        (err as Error & { code?: number })?.code === 50001
          ? 'Бот не добавлен на сервер или нет доступа. Добавьте бота на сервер или уберите ID из DISCORD_DEV_GUILD_ID.'
          : undefined,
      );
    });
  }
}
