export const DISCORD_READY_PORT = Symbol('DISCORD_READY_PORT');

export interface IDiscordReadyPort {
  isReady(): boolean;
}
