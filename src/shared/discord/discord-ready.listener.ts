import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { On, Ctx } from 'necord';
import type { ContextOf } from 'necord';

@Injectable()
export class DiscordReadyListener {
  constructor(private readonly config: ConfigService) {}

  @On('clientReady')
  handleReady(@Ctx() [client]: ContextOf<'clientReady'>) {
    const guildIds = client.guilds.cache.map((g) => g.id);
    console.log('[Discord] Bot is online');
    console.log('[Discord] Guilds:', guildIds.join(', ') || '(none)');
    const devGuildIdRaw = this.config.get<string>('DISCORD_DEV_GUILD_ID');
    const devGuildIds = devGuildIdRaw
      ? devGuildIdRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const missing = devGuildIds.filter((id) => !guildIds.includes(id));
    if (missing.length > 0) {
      console.warn(`[Discord] Команды зарегистрированы для гильдий, где бот отсутствует: ${missing.join(', ')}. Добавьте бота на эти сервера или уберите ID из DISCORD_DEV_GUILD_ID.`);
    }
  }
}
