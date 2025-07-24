import { CompiledQuery, DatabaseConnection, QueryResult } from 'kysely';
import { GArray, GDictionary, SQLite } from 'godot.lib.api';

export class GodotSQLiteKyselyConnection implements DatabaseConnection {
  #sqlite: SQLite;
  #nestedTransactionIndex = 0;

  constructor(sqlite: SQLite) {
    this.#sqlite = sqlite;
  }

  get sqlite(): SQLite {
    return this.#sqlite;
  }

  private getResultRows() {
    const client = this.#sqlite;
    const results = client.query_result_by_reference as GArray<GDictionary<Record<string, unknown>>>;
    const count = results.size();

    if (count === 0) {
      return [];
    }

    const rows = new Array<Record<string, unknown>>(count);

    const firstResult = results.get(0);

    // GDictionary keys maintain insert order. godot-sqlite inserts in the same order of columns appear in the statement
    const resultKeys = firstResult.keys();
    const keyCount = resultKeys.size();

    const keys = new Array<string>(keyCount);
    const firstRow: Record<string, unknown> = {};

    for (let i = 0; i < keyCount; i++) {
      const key = resultKeys.get(i);
      keys[i] = key;
      firstRow[key] = firstResult.get(key);
    }

    rows[0] = firstRow;

    for (let rowIndex = 1; rowIndex < results.size(); rowIndex++) {
      const row: Record<string, unknown> = {};
      const result = results.get(rowIndex);

      for (const key of keys) {
        row[key] = result.get(key);
      }

      rows[rowIndex] = row;
    }

    return rows;
  }

  async executeQuery<R>(compiledQuery: CompiledQuery<unknown>): Promise<QueryResult<R>> {
    this.#sqlite.query_with_bindings(compiledQuery.sql, GArray.create(compiledQuery.parameters));

    return {
      insertId: compiledQuery.query.kind === 'InsertQueryNode' ? BigInt(this.#sqlite.last_insert_rowid) : undefined,
      rows: this.getResultRows() as R[],
    };
  }

  streamQuery<R>(_compiledQuery: CompiledQuery<unknown>, _chunkSize?: number | undefined): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('Streaming is not supported with SQLite3');
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
