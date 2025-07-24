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

export default new Kysely({
  dialect: new GodotSQLiteKyselyDialect(
    { path: 'res://data/sqlite.db' }
  ),
});
```

## Configuration

Typically, you'll provide a configuration for connection creation. However, if you'd like to open/configure the godot-sqlite connection yourself,
you may provide a `SQLite` connection instead.

```typescript
export type GodotSQLiteKyselyConfig = {
  connection?: never;

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
  readOnly?: boolean

  /** The verbosityLevel determines the amount of logging to the Godot console that is handy for debugging your (possibly faulty) SQLite queries.
   *   ***NOTE:** Verbose and higher levels might considerably slow down your queries due to excessive logging.*
   * Default: Normal
   */
  verbosityLevel?: number;
} | {
  /** Existing godot-sqlite client/connection. The connection must be open.
   */
  connection: SQLite;
}
```

## License

MIT License, see `LICENSE`.

[godot-sqlite]: https://github.com/2shady4u/godot-sqlite
[kysely]: https://kysely.dev
