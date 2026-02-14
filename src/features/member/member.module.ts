import { Module } from '@nestjs/common';
import { RecordMemberInGuildUseCase } from './application/record-member-in-guild.use-case.js';
import { GuildMemberAddListener } from './discord/guild-member-add.listener.js';
import { GUILD_MEMBER_REPOSITORY } from './domain/guild-member.repository.js';
import { USER_REPOSITORY } from './domain/user.repository.js';
import { PrismaGuildMemberRepository } from './infrastructure/prisma-guild-member.repository.js';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository.js';
import { PrismaModule } from '../../shared/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [
    RecordMemberInGuildUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    {
      provide: GUILD_MEMBER_REPOSITORY,
      useClass: PrismaGuildMemberRepository,
    },
    GuildMemberAddListener,
  ],
  exports: [RecordMemberInGuildUseCase],
})
export class MemberModule {}
