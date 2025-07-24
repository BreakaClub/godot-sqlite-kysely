import {
  Driver,
  Kysely,
  Dialect,
  QueryCompiler,
  SqliteAdapter,
  DialectAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  DatabaseIntrospector,
} from 'kysely';

import { GodotSQLiteKyselyDriver } from './GodotSQLiteKyselyDriver';
import type { GodotSQLiteKyselyConfig } from './types';

export class GodotSQLiteKyselyDialect implements Dialect {
  #config: GodotSQLiteKyselyConfig;

  constructor(config: GodotSQLiteKyselyConfig) {
    this.#config = { ...config };
  }

  createDriver(): Driver {
    return new GodotSQLiteKyselyDriver(this.#config);
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  createAdapter(): DialectAdapter {
    return new SqliteAdapter();
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}
