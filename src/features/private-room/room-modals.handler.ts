import { Modal, Ctx, ModalParam } from 'necord';
import type { ModalContext } from 'necord';
import { Injectable } from '@nestjs/common';
import { MODAL_IDS, MODAL_INPUT_IDS } from './private-room.constants.js';
import { PrivateRoomService } from './private-room.service.js';

@Injectable()
export class RoomModalsHandler {
  constructor(private readonly roomService: PrivateRoomService) {}

  @Modal(`${MODAL_IDS.RENAME}/:roomId`)
  async rename(
    @Ctx() [interaction]: ModalContext,
    @ModalParam('roomId') roomId: string,
  ) {
    await interaction.deferReply({ ephemeral: true });
    const name = interaction.fields.getTextInputValue(MODAL_INPUT_IDS.RENAME_NAME)?.trim();
    if (!name) {
      await interaction.editReply({ content: 'Введите название.' });
      return;
    }
    try {
      await this.roomService.updateRoomName(roomId, name);
      await interaction.editReply({ content: `Название изменено на «${name}».` });
    } catch {
      await interaction.editReply({ content: 'Ошибка изменения названия.' });
    }
  }

  @Modal(`${MODAL_IDS.LIMIT}/:roomId`)
  async limit(
    @Ctx() [interaction]: ModalContext,
    @ModalParam('roomId') roomId: string,
  ) {
    await interaction.deferReply({ ephemeral: true });
    const raw = interaction.fields.getTextInputValue(MODAL_INPUT_IDS.LIMIT_VALUE)?.trim();
    const limit = raw ? parseInt(raw, 10) : 0;
    if (Number.isNaN(limit) || limit < 0 || limit > 99) {
      await interaction.editReply({ content: 'Введите число от 0 до 99.' });
      return;
    }
    try {
      await this.roomService.setRoomUserLimit(roomId, limit);
      await interaction.editReply({ content: `Лимит участников: ${limit}.` });
    } catch {
      await interaction.editReply({ content: 'Ошибка изменения лимита.' });
    }
  }
}
