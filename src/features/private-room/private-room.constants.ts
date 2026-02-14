export const CATEGORY_NAME = 'Приватные комнаты';
export const INTERFACE_CHANNEL_NAME = 'управление';
export const CREATE_VOICE_NAME = '➕ Создать';

export const MANAGEMENT_EMBED_IMAGE_URL =
  'https://cdn.discordapp.com/attachments/1432072199468089455/1472376344439685264/92WXKSe.png';
export const MANAGEMENT_EMBED_COLOR = 0x8b5cf6;

export const ROOM_BUTTONS = {
  RENAME: 'room_rename',
  LIMIT: 'room_limit',
  CLOSE: 'room_close',
  OPEN: 'room_open',
  KICK: 'room_kick',
  GIVE_ACCESS: 'room_give',
  REVOKE_ACCESS: 'room_revoke',
  TRANSFER: 'room_transfer',
  DELETE: 'room_delete',
} as const;

export const MODAL_IDS = {
  RENAME: 'room_modal_rename',
  LIMIT: 'room_modal_limit',
} as const;

export const MODAL_INPUT_IDS = {
  RENAME_NAME: 'name',
  LIMIT_VALUE: 'limit',
} as const;

export const SELECT_IDS = {
  KICK: 'room_select_kick',
  GIVE_ACCESS: 'room_select_give',
  REVOKE_ACCESS: 'room_select_revoke',
  TRANSFER: 'room_select_transfer',
} as const;
