import { SlashCommand, Ctx } from 'necord';
import type { SlashCommandContext } from 'necord';
import { Injectable } from '@nestjs/common';
import { RecordMemberInGuildUseCase } from '../../features/member/application/record-member-in-guild.use-case.js';

@Injectable()
export class PingCommand {
  constructor(
    private readonly recordMemberInGuild: RecordMemberInGuildUseCase,
  ) {}

  @SlashCommand({
    name: 'ping',
    description: 'Проверка работы бота',
  })
  async ping(@Ctx() [interaction]: SlashCommandContext) {
    const guildId = interaction.guildId;
    if (guildId) {
      this.recordMemberInGuild
        .execute({
          guildId,
          discordUserId: interaction.user.id,
          username: interaction.user.username ?? null,
          globalName: interaction.user.globalName ?? null,
          avatarUrl: interaction.user.displayAvatarURL({ size: 128 }),
        })
        .catch(() => {});
    }
    await interaction.reply({
      content: `Понг! Задержка: ${Date.now() - interaction.createdTimestamp} мс`,
      ephemeral: true,
    });
  }
}
