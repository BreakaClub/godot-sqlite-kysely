import { DatabaseConnection, Driver, TransactionSettings } from 'kysely';

import { GodotSQLiteKyselyConnection } from './GodotSQLiteKyselyConnection';
import type { GodotSQLiteKyselyConfig } from './types';
import { SQLite } from 'godot.lib.api';

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
        connection = new GodotSQLiteKyselyConnection(config.connection);
      } else {
        const {
          defaultExtension = 'db',
          foreignKeys = true,
          path,
          readOnly = false,
          verbosityLevel = SQLite.VerbosityLevel.NORMAL,
        } = config;

        const sqlite = new SQLite();
        sqlite.default_extension = defaultExtension;
        sqlite.foreign_keys = foreignKeys;
        sqlite.path = path;
        sqlite.read_only = readOnly;
        sqlite.verbosity_level = verbosityLevel;

        if (!sqlite.open_db()) {
          throw new Error(`Failed to open godot-sqlite connection: ${sqlite.error_message}`);
        }

        connection = new GodotSQLiteKyselyConnection(sqlite);
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

    this.#connection.sqlite.close_db();
    this.#connection = undefined;
  }
}
