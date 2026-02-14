import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { HealthModule } from './features/health/health.module.js';
import { DiscordModule } from './shared/discord/discord.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HealthModule,
    DiscordModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
