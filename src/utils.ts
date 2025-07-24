import { GArray, GDictionary, SQLite } from 'godot.lib.api';
import { GodotSQLiteKyselyConnectionConfig } from './types';

export function createSQLiteConnection(config: GodotSQLiteKyselyConnectionConfig) {
  const { defaultExtension = 'db', foreignKeys = true, path, readOnly = false, verbosityLevel = SQLite.VerbosityLevel.NORMAL } = config;

  const sqlite = new SQLite();
  sqlite.default_extension = defaultExtension;
  sqlite.foreign_keys = foreignKeys;
  sqlite.path = path;
  sqlite.read_only = readOnly;
  sqlite.verbosity_level = verbosityLevel;

  if (!sqlite.open_db()) {
    throw new Error(`Failed to open godot-sqlite connection: ${sqlite.error_message}`);
  }

  return sqlite;
}

export function getResultRows(client: SQLite) {
  const results = client.query_result_by_reference as GArray<GDictionary<Record<string, unknown>>>;
  const count = results.size();

  if (count === 0) {
    return [];
  }

  const rows = new Array<Record<string, unknown>>(count);

  const firstResult = results.get(0);
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
