import { DatabaseConnection, Driver, TransactionSettings } from 'kysely';

import { GodotSQLiteKyselyConnection } from './GodotSQLiteKyselyConnection';
import type { GodotSQLiteKyselyConfig } from './types';
import { GodotSQLiteKyselyWorkerConnection } from './GodotSQLiteKyselyWorkerConnection';
import { GodotSQLiteKyselySyncConnection } from './GodotSQLiteKyselySyncConnection';
import { createSQLiteConnection } from './utils';

export class GodotSQLiteKyselyDriver implements Driver {
  #config: GodotSQLiteKyselyConfig;
  #connection: undefined | GodotSQLiteKyselyConnection;

  constructor(config: GodotSQLiteKyselyConfig) {
    this.#config = config;
  }

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    let connection = this.#connection;

    if (!connection) {
      const config = this.#config;

      if (config.connection) {
        connection = new GodotSQLiteKyselySyncConnection(config.connection);
      } else {
        connection = config.workerModule
          ? new GodotSQLiteKyselyWorkerConnection(config, config.workerModule)
          : new GodotSQLiteKyselySyncConnection(createSQLiteConnection(config));
      }

      this.#connection = connection;
    }

    return connection;
  }

  async releaseConnection(_connection: GodotSQLiteKyselyConnection): Promise<void> {
    // Not implemented. No pooling.
  }

  beginTransaction(connection: GodotSQLiteKyselyConnection, _settings: TransactionSettings): Promise<void> {
    return connection.beginTransaction();
  }

  commitTransaction(connection: GodotSQLiteKyselyConnection): Promise<void> {
    return connection.commitTransaction();
  }

  rollbackTransaction(connection: GodotSQLiteKyselyConnection): Promise<void> {
    return connection.rollbackTransaction();
  }

  async destroy(): Promise<void> {
    if (!this.#connection || this.#config.connection) {
      return;
    }

    this.#connection.close();
    this.#connection = undefined;
  }
}
