export const DB_PING_REPOSITORY = Symbol('DB_PING_REPOSITORY');

export interface IDbPingRepository {
  ping(): Promise<void>;
}
