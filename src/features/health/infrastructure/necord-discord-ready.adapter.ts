import { Injectable } from '@nestjs/common';
import { Client } from 'discord.js';
import type { IDiscordReadyPort } from '../domain/discord-ready.port.js';

@Injectable()
export class NecordDiscordReadyAdapter implements IDiscordReadyPort {
  constructor(private readonly client: Client) {}

  isReady(): boolean {
    return this.client.isReady();
  }
}
