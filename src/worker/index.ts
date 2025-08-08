import { GArray, SQLite } from 'godot.lib.api';
import { JSWorkerParent } from 'godot.worker';
import { createSQLiteConnection, getResultRows } from '../utils';
import { WorkerRequest, WorkerResponse } from './messaging';

let sqlite: null | SQLite = null;

function postResponse(message: WorkerResponse) {
  return JSWorkerParent!.postMessage(message);
}

export function initializeWorker() {
  if (!JSWorkerParent) {
    return;
  }

  JSWorkerParent.close = () => {
    if (!sqlite) {
      return;
    }

    sqlite.close_db();
    sqlite = null;
  };

  JSWorkerParent.onmessage = (request: WorkerRequest) => {
    switch (request.type) {
      case 'initialize':
        if (sqlite) {
          postResponse({
            type: 'initializationError',
            message: 'Worker already initialized',
          });
        } else {
          try {
            sqlite = createSQLiteConnection(request.config);
            postResponse({
              type: 'initialized',
            });
          } catch (e: unknown) {
            postResponse({
              type: 'initializationError',
              message: e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
                ? e.message
                : 'Failed to initialize worker connection',
            });
          }
        }
        break;

      case 'query': {
        const { id, query, parameters } = request;

        if (!sqlite) {
          postResponse({
            type: 'queryError',
            id,
            message: 'Worker not initialized',
          });
          break;
        }

        try {
          const bindings = typeof parameters === 'undefined' || Array.isArray(parameters)
            ? GArray.create(parameters ?? [])
            : parameters as GArray;

          if (sqlite.query_with_bindings(query, bindings)) {
            postResponse({
              type: 'queryResult',
              id,
              result: {
                rows: getResultRows(sqlite),
              },
            });
          } else {
            postResponse({
              type: 'queryError',
              id,
              message: sqlite.error_message,
            });
          }
        } catch (e: unknown) {
          postResponse({
            type: 'queryError',
            id,
            message: e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
              ? e.message
              : 'Failed to perform query',
          });
        }
        break;
      }

      case 'terminate':
        sqlite?.close_db();
        sqlite = null;
        postResponse({
          type: 'terminated',
        });
        break;

      default:
        console.error('Unhandled worker request: ' + JSON.stringify(request satisfies never, null, 2));
        break;
    }
  }
}
