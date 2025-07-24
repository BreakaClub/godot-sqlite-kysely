import { DatabaseConnection } from 'kysely';

export interface GodotSQLiteKyselyConnection extends DatabaseConnection {
  close(): Promise<void>;

  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
}
