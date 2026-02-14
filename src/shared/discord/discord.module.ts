import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GatewayIntentBits } from 'discord.js';
import { NecordModule } from 'necord';
import { DiscordClientErrorHandler } from './discord-client-error.handler.js';
import { DiscordReadyListener } from './discord-ready.listener.js';
import { PingCommand } from './ping.command.js';
import { normalizeDiscordToken, validateDiscordToken } from './normalize-token.js';
import { MemberModule } from '../../features/member/member.module.js';
import { PrivateRoomModule } from '../../features/private-room/private-room.module.js';

@Module({
  imports: [
    MemberModule,
    PrivateRoomModule,
    NecordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const token = normalizeDiscordToken(config.get<string>('DISCORD_TOKEN'));
        validateDiscordToken(token);
        const devGuildIdRaw = config.get<string>('DISCORD_DEV_GUILD_ID');
        const guildIds = devGuildIdRaw
          ? devGuildIdRaw.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        const development = guildIds.length > 0 ? guildIds : false;
        return {
          token,
          development,
          intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildModeration,
          GatewayIntentBits.GuildEmojisAndStickers,
          GatewayIntentBits.GuildIntegrations,
          GatewayIntentBits.GuildWebhooks,
          GatewayIntentBits.GuildInvites,
          GatewayIntentBits.GuildVoiceStates,
          GatewayIntentBits.GuildPresences,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildMessageReactions,
          GatewayIntentBits.GuildMessageTyping,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.DirectMessageReactions,
          GatewayIntentBits.DirectMessageTyping,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildScheduledEvents,
          GatewayIntentBits.AutoModerationConfiguration,
          GatewayIntentBits.AutoModerationExecution,
        ],
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [DiscordClientErrorHandler, DiscordReadyListener, PingCommand],
  exports: [NecordModule],
})
export class DiscordModule {}
