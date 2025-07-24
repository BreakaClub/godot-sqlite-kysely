import { SQLite } from 'godot.lib.api';

export type GodotSQLiteKyselyConfig =
  | {
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
      readOnly?: boolean;

      /** The verbosityLevel determines the amount of logging to the Godot console that is handy for debugging your (possibly faulty) SQLite queries.
       *   ***NOTE:** Verbose and higher levels might considerably slow down your queries due to excessive logging.*
       * Default: Normal
       */
      verbosityLevel?: number;
    }
  | {
      /** Existing godot-sqlite client/connection. The connection must be open.
       */
      connection: SQLite;
    };
