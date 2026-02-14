import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module.js';
import { ChannelDeleteListener } from './channel-delete.listener.js';
import { AdminGuard } from './guards/admin.guard.js';
import { OwnerOrAdminGuard } from './guards/owner-or-admin.guard.js';
import { PrivateRoomService } from './private-room.service.js';
import { RoomButtonsHandler } from './room-buttons.handler.js';
import { RoomModalsHandler } from './room-modals.handler.js';
import { RoomSelectHandler } from './room-select.handler.js';
import { RoomSettingsCommand } from './room-settings.command.js';
import { VoiceStateListener } from './voice-state.listener.js';

@Module({
  imports: [PrismaModule],
  providers: [
    PrivateRoomService,
    AdminGuard,
    OwnerOrAdminGuard,
    RoomSettingsCommand,
    VoiceStateListener,
    ChannelDeleteListener,
    RoomButtonsHandler,
    RoomModalsHandler,
    RoomSelectHandler,
  ],
})
export class PrivateRoomModule {}
