import { GArray } from 'godot.lib.api';
import { JSWorker } from 'godot.worker';
import { CompiledQuery, DatabaseConnection, QueryResult } from 'kysely';
import { GodotSQLiteKyselyConnectionConfig } from './types';
import { WorkerRequest, WorkerResponse } from './worker/messaging';

export class GodotSQLiteKyselyWorkerConnection implements DatabaseConnection {
  #nestedTransactionIndex = 0;
  #queryCallbacks = new Map<number, (result: string | QueryResult<unknown>) => void>();
  #queryIndex = 0;
  #transferParameters = false;
  #worker: JSWorker;
  #workerPromise: null | Promise<void>;

  #postRequest(message: WorkerRequest) {
    if (this.#transferParameters && message.type === 'query') {
      this.#worker.postMessage(message, Array.isArray(message.parameters) ? message.parameters : [message.parameters]);
    } else {
      this.#worker.postMessage(message);
    }
  }

  constructor(config: GodotSQLiteKyselyConnectionConfig & { transferQueries?: boolean }, workerModule: string) {
    this.#transferParameters = config.transferQueries ?? false;
    this.#worker = new JSWorker(workerModule);
    this.#workerPromise = new Promise<void>((resolve, reject) => {
      this.#worker.onmessage = (response: WorkerResponse) => {
        switch (response.type) {
          case 'initializationError':
            console.error(`Worker SQLite connection error: ${response}`);
            this.#workerPromise = null;
            reject(new Error(response.message));
            break;

          case 'initialized':
            this.#workerPromise = null;
            resolve();
            break;

          case 'queryError': {
            const { id, message } = response;
            const callback = this.#queryCallbacks.get(id);

            if (!callback) {
              console.error(`Received query error for unknown query index: ${id}`);
              break;
            }

            callback(message);
            break;
          }

          case 'queryResult': {
            const { id, result } = response;
            const callback = this.#queryCallbacks.get(id);

            if (!callback) {
              console.error(`Received query result for unknown query index: ${id}`);
              break;
            }

            callback(result);
            break;
          }

          case 'terminated':
            break;

          default:
            console.error('Unhandled worker response: ' + JSON.stringify(response satisfies never, null, 2));
            break;
        }
      };
      this.#worker.onready = () => {
        this.#postRequest({
          type: 'initialize',
          config,
        });
      };
    });
  }

  close(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const previousOnMessage = this.#worker.onmessage;

      this.#worker.onmessage = (response: WorkerResponse) => {
        if (response.type === 'terminated') {
          try {
            this.#worker.terminate();
            resolve();
          } catch (e: unknown) {
            reject(e);
          }
        } else {
          previousOnMessage?.(response);
        }
      };

      this.#postRequest({
        type: 'terminate',
      });
    });
  }

  async #postQuery<R>(query: string, parameters: readonly unknown[] | GArray<unknown>): Promise<QueryResult<R>> {
    if (this.#workerPromise) {
      await this.#workerPromise;
    }

    const queryIndex = this.#queryIndex++;

    return await new Promise<QueryResult<R>>((resolve, reject) => {
      this.#queryCallbacks.set(queryIndex, (result: string | QueryResult<unknown>) => {
        this.#queryCallbacks.delete(queryIndex);

        if (typeof result === 'string') {
          const params = Array.isArray(parameters) ? parameters : [...(parameters as GArray).proxy()];
          reject(new Error(`${result}. Query: ${query} (${params.join(', ')}). `));
        } else {
          resolve(result as QueryResult<R>);
        }
      });

      this.#postRequest({
        type: 'query',
        id: queryIndex,
        query,
        parameters,
      });
    });
  }

  executeQuery<R>(compiledQuery: CompiledQuery<unknown>): Promise<QueryResult<R>> {
    return this.#postQuery(compiledQuery.sql, compiledQuery.parameters);
  }

  streamQuery<R>(_compiledQuery: CompiledQuery<unknown>, _chunkSize?: number | undefined): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('Streaming is not supported with SQLite3');
  }

  async beginTransaction(): Promise<void> {
    const savepointName = `sp${this.#nestedTransactionIndex++}`;
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
