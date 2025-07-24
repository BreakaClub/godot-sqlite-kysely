import { CompiledQuery, DatabaseConnection, QueryResult } from 'kysely';
import { GArray, SQLite } from 'godot.lib.api';
import { getResultRows } from './utils';

export class GodotSQLiteKyselySyncConnection implements DatabaseConnection {
  #sqlite: SQLite;
  #nestedTransactionIndex = 0;

  constructor(sqlite: SQLite) {
    this.#sqlite = sqlite;
  }

  async executeQuery<R>(compiledQuery: CompiledQuery<unknown>): Promise<QueryResult<R>> {
    const sqlite = this.#sqlite;

    sqlite.query_with_bindings(compiledQuery.sql, GArray.create(compiledQuery.parameters));

    return {
      insertId: compiledQuery.query.kind === 'InsertQueryNode' ? BigInt(sqlite.last_insert_rowid) : undefined,
      rows: getResultRows(sqlite) as R[],
    };
  }

  streamQuery<R>(_compiledQuery: CompiledQuery<unknown>, _chunkSize?: number | undefined): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('Streaming is not supported with SQLite3');
  }

  async close(): Promise<void> {
    this.#sqlite.close_db();
  }

  async beginTransaction(): Promise<void> {
    const savepointName = `sp${++this.#nestedTransactionIndex}`;

    if (!this.#sqlite.query(`savepoint ${savepointName}`)) {
      throw new Error(`beginTransaction (${savepointName}) failed: ${this.#sqlite.error_message}`);
    }
  }

  async commitTransaction(): Promise<void> {
    if (this.#nestedTransactionIndex <= 0) {
      throw new Error('No transactions in progress');
    }

    const savepointName = `sp${--this.#nestedTransactionIndex}`;

    if (!this.#sqlite.query(`release savepoint ${savepointName}`)) {
      throw new Error(`commitTransaction (${savepointName}) failed: ${this.#sqlite.error_message}`);
    }
  }

  async rollbackTransaction(): Promise<void> {
    if (this.#nestedTransactionIndex <= 0) {
      throw new Error('No transactions in progress');
    }

    const savepointName = `sp${--this.#nestedTransactionIndex}`;

    if (!this.#sqlite.query(`rollback to savepoint ${savepointName}`)) {
      throw new Error(`commitTransaction (${savepointName}) failed: ${this.#sqlite.error_message}`);
    }
  }
}
