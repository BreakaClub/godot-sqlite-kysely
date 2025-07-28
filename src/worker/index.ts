import { GArray, SQLite } from 'godot.lib.api';
import { JSWorkerParent } from 'godot.worker';
import { GodotSQLiteKyselyConnectionConfig } from '../types';
import { createSQLiteConnection, getResultRows } from '../utils';

let sqlite: null | SQLite = null;

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

  JSWorkerParent.onmessage = (message: GodotSQLiteKyselyConnectionConfig | [number, string, unknown[]]) => {
    if (!Array.isArray(message)) {
      try {
        sqlite = createSQLiteConnection(message);
        JSWorkerParent!.postMessage(true); // Indicates the connection succeeded
      } catch (e: unknown) {
        JSWorkerParent!.postMessage(e && typeof e === 'object' && 'message' in e ? e.message : 'Failed to initialize worker connection');
      }
      return;
    }

    const [id, query, parameters] = message;

    if (!sqlite) {
      JSWorkerParent!.postMessage({
        id,
        result: 'Worker does not have an open SQLite connection',
      });
      return;
    }

    try {
      if (sqlite.query_with_bindings(query, GArray.create(parameters))) {
        JSWorkerParent!.postMessage({
          id,
          result: {
            rows: getResultRows(sqlite),
          },
        });
      } else {
        JSWorkerParent!.postMessage({
          id,
          result: sqlite.error_message,
        });
      }
    } catch (e: unknown) {
      JSWorkerParent!.postMessage({
        id,
        result: e && typeof e === 'object' && 'message' in e ? e.message : `Failed to perform query`,
      });
    }
  };
}
