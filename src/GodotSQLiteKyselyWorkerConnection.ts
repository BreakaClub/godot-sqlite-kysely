import { CompiledQuery, DatabaseConnection, QueryResult } from 'kysely';
import { JSWorker } from 'godot.worker';
import { GodotSQLiteKyselyConnectionConfig } from './types';

interface ResultMessage {
  id: number;
  result: string | QueryResult<unknown>;
}

export class GodotSQLiteKyselyWorkerConnection implements DatabaseConnection {
  #nestedTransactionIndex = 0;
  #queryCallbacks = new Map<number, (result: string | QueryResult<unknown>) => void>();
  #queryIndex = 0;
  #worker: JSWorker;
  #workerPromise: null | Promise<void>;

  constructor(config: GodotSQLiteKyselyConnectionConfig, workerModule: string) {
    this.#worker = new JSWorker(workerModule);
    this.#workerPromise = new Promise<void>((resolve, reject) => {
      this.#worker.onmessage = (message: true | string | ResultMessage) => {
        if (message === true) {
          this.#workerPromise = null;
          resolve();
          return;
        }

        if (typeof message === 'string') {
          console.error(`Worker SQLite connection error: ${message}`);
          this.#workerPromise = null;
          reject(new Error(message));
          return;
        }

        const { id, result } = message;

        const callback = this.#queryCallbacks.get(id);

        if (!callback) {
          console.error(`Received query result for unknown query index: ${id}`);
          return;
        }

        callback(result);
      };
      this.#worker.onready = () => {
        this.#worker.postMessage(config);
      };
    });
  }

  async close(): Promise<void> {
    this.#worker.terminate();
  }

  async #postQuery<R>(query: string, parameters: readonly unknown[]): Promise<QueryResult<R>> {
    if (this.#workerPromise) {
      await this.#workerPromise;
    }

    const queryIndex = this.#queryIndex++;

    return await new Promise<QueryResult<R>>((resolve, reject) => {
      this.#queryCallbacks.set(queryIndex, (result: string | QueryResult<unknown>) => {
        this.#queryCallbacks.delete(queryIndex);

        if (typeof result === 'string') {
          console.error(`Query ${queryIndex} failed. Query: ${query}. Error: ${result}`);
          reject(new Error(result));
        } else {
          resolve(result as QueryResult<R>);
        }
      });

      this.#worker.postMessage([queryIndex, query, parameters]);
    });
  }

  executeQuery<R>(compiledQuery: CompiledQuery<unknown>): Promise<QueryResult<R>> {
    return this.#postQuery(compiledQuery.sql, compiledQuery.parameters);
  }

  streamQuery<R>(_compiledQuery: CompiledQuery<unknown>, _chunkSize?: number | undefined): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('Streaming is not supported with SQLite3');
  }

  async beginTransaction(): Promise<void> {
    const savepointName = `sp${++this.#nestedTransactionIndex}`;
    this.#postQuery(`savepoint ${savepointName}`, []);
  }

  async commitTransaction(): Promise<void> {
    if (this.#nestedTransactionIndex <= 0) {
      throw new Error('No transactions in progress');
    }

    const savepointName = `sp${--this.#nestedTransactionIndex}`;
    this.#postQuery(`release savepoint ${savepointName}`, []);
  }

  async rollbackTransaction(): Promise<void> {
    if (this.#nestedTransactionIndex <= 0) {
      throw new Error('No transactions in progress');
    }

    const savepointName = `sp${--this.#nestedTransactionIndex}`;
    this.#postQuery(`rollback to savepoint ${savepointName}`, []);
  }
}
