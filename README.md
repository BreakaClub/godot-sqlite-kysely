# Kysely - Godot SQLite 

Custom dialect for [kysely] to use together with [godot-sqlite](https://github.com/2shady4u/godot-sqlite) and [GodotJS](https://github.com/godotjs/GodotJS).

## Installation
Install [godot-sqlite](https://github.com/2shady4u/godot-sqlite) in accordance with its installation instructions (there are a few options; all are fine).

After installing `godot-sqlite` you should regenerate GodotJS types and verify `SQLite` is now available from the `godot` module.

> Project -> Tools -> GodotJS -> Generate Types

Finally, install kysely and godot-sqlite-kysely with your preferred package manager e.g.

```shell
npm install --save kysely godot-sqlite-kysely
```

```shell
yarn add kysely godot-sqlite-kysely
```

```shell
pnpm add kysely godot-sqlite-kysely
```

## Usage

```typescript
import { Kysely } from 'kysely';
import GodotSQLiteKyselyDialect from 'godot-sqlite-kysely';

export const db = new Kysely<Database>({
  dialect: new GodotSQLiteKyselyDialect(
    {
      path: this.dbName,
      workerModule: 'src/database/worker',
    },
  ),
});
```

See [Kysely's Getting Started documentation](https://kysely.dev/docs/getting-started) for more information.

> [!NOTE]
> Use `GodotSQLiteKyselyDialect` as above in place of `PostgresDialect` in the Getting Started documentation.

## Using a worker thread

Kysely's APIs are asynchronous; however, godot-sqlite performs queries synchronously. Assuming you're using Kysely in a regular GodotJS script this means SQLite
queries will happen on Godot's main thread. SQLite is fast, so this is fine for many use cases, e.g., saving game state at explicit save points. However, we also
provide an option to perform queries on another thread using a [GodotJS worker](https://github.com/godotjs/GodotJS/wiki/Worker). This is particularly helpful for
use-cases where you wish to write to the database during regular gameplay e.g., continuously synchronizing game state to disk.

There's some additional setup to make this work because GodotJS workers require you to provide a module name to the worker on start-up.

1. Create a worker script anywhere in your Godot project e.g. `res://src/database/worker.ts`
2. Add the following contents:
  ```ts
  import { initializeWorker } from 'godot-sqlite-kysely/worker';
  
  initializeWorker();
  ```
3. Provide the module name (essentially a resource path without "res://" or a file extension) when configuring `GodotSQLiteKyselyDialect`:
  ```ts
  export const db = new Kysely<Database>({
    dialect: new GodotSQLiteKyselyDialect(
      {
        path: this.dbName,
        workerModule: 'src/database/worker',
      },
    ),
  });
  ```

## Configuration

Typically, you'll provide a configuration for connection creation. However, if you'd like to open/configure the godot-sqlite connection yourself,
you may provide a `SQLite` connection instead.

```typescript
export interface GodotSQLiteKyselyConnectionConfig {
  /** Default extension that is automatically appended to the `path`-variable whenever **no** extension is detected/given.
   *   ***NOTE:** If database files without extension are desired, this variable has to be set to "" (= an empty string) as to skip this automatic procedure entirely.*
   * Default: db
   */
  defaultExtension?: string;

  /** Enables or disables the availability of [url=https://www.sqlite.org/foreignkeys.html]foreign keys[/url] in the SQLite database.
   * Default: true
   * */
  foreignKeys?: boolean;

  /** Path to the database, should be set before opening the database with `open_db()`. If no database with this name exists, a new one at the supplied path will be created. Both `res://` and `user://` keywords can be used to define the path. */
  path: string;

  /** Enabling this property opens the database in read-only modus & allows databases to be packaged inside of the PCK. To make this possible, a custom [url=https://www.sqlite.org/vfs.html]VFS[/url] is employed which internally takes care of all the file handling using the Godot API.
   * Default: false
   * */
  readOnly?: boolean;

  /** The verbosityLevel determines the amount of logging to the Godot console that is handy for debugging your (possibly faulty) SQLite queries.
   *   ***NOTE:** Verbose and higher levels might considerably slow down your queries due to excessive logging.*
   * Default: Normal
   */
  verbosityLevel?: number;
}

export type GodotSQLiteKyselyConfig =
  | (GodotSQLiteKyselyConnectionConfig & {
  connection?: never;

  /** Execute SQLite queries on another thread (a GodotJS JSWorker). Query results are transferred from the worker back to the parent
   * JavaScript environment. This introduces some overhead per query, but may be preferable to blocking the main thread whilst SQLite
   * performs queries.
   *
   * The string specified must refer to a module name. For example, if your worker script exists at res://src/database/worker.ts then you
   * should provide the string 'src/database/worker'.
   *
   * The worker module itself must call initializeWorker().
   *
   * Default: undefined
   */
  workerModule?: string;
})
  | {
  /** Existing godot-sqlite client/connection. The connection must be open.
   */
  connection: SQLite;
};
```

## License

MIT License, see `LICENSE`.

[godot-sqlite]: https://github.com/2shady4u/godot-sqlite
[kysely]: https://kysely.dev
