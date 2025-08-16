interface Console {
	assert(condition?: boolean, ...data: any[]): void;
	debug(...data: any[]): void;
	error(...data: any[]): void;
	info(...data: any[]): void;
	log(...data: any[]): void;
	warn(...data: any[]): void;
}
declare const console: Console;

// Subset of Godot core + godot-sqlite types
// Using godot.lib.api instead of godot so that this library is camel-case
// binding agnostic.
declare module 'godot.lib.api' {
	type GAny = undefined | null | boolean | int64 | float64 | string | Vector2 | Vector2I | Rect2 | Rect2I | Vector3 | Vector3I | Transform2D | Vector4 | Vector4I | Plane | Quaternion | Aabb | Basis | Transform3D | Projection | Color | StringName | NodePath | Rid | GObject | Callable | Signal | GDictionary | GArray | PackedByteArray | PackedInt32Array | PackedInt64Array | PackedFloat32Array | PackedFloat64Array | PackedStringArray | PackedVector2Array | PackedVector3Array | PackedColorArray | PackedVector4Array;
	type int64 = number; /* || bigint */
	class Callable<T extends (...args: any[]) => any> {
		call: T;
	}
	class GDictionary<T = Record<any, any>> {
		get<K extends keyof T>(key: K, default_?: any /* = <any> {} */): T[K];
		set<K extends keyof T>(key: K, value: T[K]): boolean;
		keys(): GArray<keyof T>;
		proxy<Write extends boolean = false>(): Write extends true ? GDictionaryProxy<T> : GDictionaryReadProxy<T>;
	}
	type GDictionaryProxy<T> = {
		[K in keyof T]: T[K] | GProxyValueWrap<T[K]>;
	};
	type GDictionaryReadProxy<T> = {
		[K in keyof T]: GReadProxyValueWrap<T[K]>;
	};
	class GArray<T = any> {
		static create<T>(values: ReadonlyArray<T>): GArray<T>;
		get(index: int64): T;
		set(index: int64, value: T): void;
		size(): int64;
		proxy<Write extends boolean = false>(): Write extends true ? GArrayProxy<T> : GArrayReadProxy<T>;
	}
	class GArrayProxy<T> {
		[Symbol.iterator](): IteratorObject<GProxyValueWrap<T>>;
		[n: number]: T | GProxyValueWrap<T>;
	}
	type GArrayReadProxy<T> = Omit<GArrayProxy<T>, 'forEach'> & {
		[Symbol.iterator](): IteratorObject<GReadProxyValueWrap<T>>;
		[n: number]: GReadProxyValueWrap<T>;
	}
	type GProxyValueWrap<V> = V extends GArray<infer E>
		? GArrayProxy<E>
		: V extends GDictionary<infer T>
			? GDictionaryProxy<T>
			: V;
	type GReadProxyValueWrap<V> = V extends GArray<infer E>
		? GArrayReadProxy<E>
		: V extends GDictionary<infer T>
			? GDictionaryReadProxy<T>
			: V;
	class Object {}
	namespace SQLite {
		enum VerbosityLevel {
			QUIET = 0,
			NORMAL = 1,
			VERBOSE = 2,
			VERY_VERBOSE = 3,
		}
	}
	/** A SQLite wrapper class implemented in GDExtension.
	 *
	 *  @link https://docs.godotengine.org/en/latest/classes/class_sqlite.html
	 */
	class SQLite {
		static readonly SQLITE_OK = 0;
		static readonly SQLITE_ERROR = 1;
		static readonly SQLITE_INTERNAL = 2;
		static readonly SQLITE_PERM = 3;
		static readonly SQLITE_ABORT = 4;
		static readonly SQLITE_BUSY = 5;
		static readonly SQLITE_LOCKED = 6;
		static readonly SQLITE_NOMEM = 7;
		static readonly SQLITE_READONLY = 8;
		static readonly SQLITE_INTERRUPT = 9;
		static readonly SQLITE_IOERR = 10;
		static readonly SQLITE_CORRUPT = 11;
		static readonly SQLITE_NOTFOUND = 12;
		static readonly SQLITE_FULL = 13;
		static readonly SQLITE_CANTOPEN = 14;
		static readonly SQLITE_PROTOCOL = 15;
		static readonly SQLITE_EMPTY = 16;
		static readonly SQLITE_SCHEMA = 17;
		static readonly SQLITE_TOOBIG = 18;
		static readonly SQLITE_CONSTRAINT = 19;
		static readonly SQLITE_MISMATCH = 20;
		static readonly SQLITE_MISUSE = 21;
		static readonly SQLITE_NOLFS = 22;
		static readonly SQLITE_AUTH = 23;
		static readonly SQLITE_FORMAT = 24;
		static readonly SQLITE_RANGE = 25;
		static readonly SQLITE_NOTADB = 26;
		static readonly SQLITE_NOTICE = 27;
		static readonly SQLITE_WARNING = 28;
		static readonly SQLITE_ROW = 100;
		static readonly SQLITE_DONE = 101;
		constructor(identifier?: any);

		/** Open a new database connection. Multiple concurrently open connections to the same database are possible. */
		open_db(): boolean;

		/** Close the current database connection. */
		close_db(): boolean;

		/** Query the database using the raw SQL statement defined in `query_string`. */
		query(query_string: string): boolean;

		/** Binds the parameters contained in the `param_bindings`-variable to the query. Using this function stops any possible attempts at SQL data injection as the parameters are sanitized. More information regarding parameter bindings can be found [url=https://www.sqlite.org/c3ref/bind_blob.html]here[/url].
		 *  **Example usage**:
		 *
		 *  Using bindings is optional, except for PackedByteArray (= raw binary data) which has to binded to allow the insertion and selection of BLOB data in the database.
		 *   ***NOTE:** Binding column names is not possible due to SQLite restrictions. If dynamic column names are required, insert the column name directly into the `query_string`-variable itself (see [url=https://github.com/2shady4u/godot-sqlite/issues/41]https://github.com/2shady4u/godot-sqlite/issues/41[/url]).*
		 */
		query_with_bindings(query_string: string, param_bindings: GArray): boolean;

		/** Each key/value pair of the `table_dictionary`-variable defines a column of the table. Each key defines the name of a column in the database, while the value is a dictionary that contains further column specifications.
		 *  **Required fields**:
		 *  - **"data_type"**: type of the column variable, following values are valid*:
		 *      - "int" (SQLite: INTEGER, GODOT: [constant TYPE_INT])[br]    - "real" (SQLite: REAL, GODOT: [constant TYPE_REAL])[br]    - "text" (SQLite: TEXT, GODOT: [constant TYPE_STRING])[br]    - "char(?)"** (SQLite: CHAR(?)**, GODOT: [constant TYPE_STRING])[br]    - "blob" (SQLite: BLOB, GODOT: [constant TYPE_PACKED_BYTE_ARRAY])
		 *      *  *Data types not found in this list throw an error and end up finalizing the current SQLite statement.* [br]    **  *with the question mark being replaced by the maximum amount of characters*
		 *  **Optional fields**:
		 *  - **"not_null"**  *(default = false)* : Is the NULL value an invalid value for this column?[br]- **"unique"**  *(default = false)* : Does the column have a unique constraint?[br]- **"default"**: The default value of the column if not explicitly given.[br]- **"primary_key"**  *(default = false)* : Is this the primary key of this table?
		 *      Multiple columns can be set as a primary key.
		 *  - **"auto_increment"**  *(default = false)* : Automatically increment this column when no explicit value is given. This auto-generated value will be one more (+1) than the largest value currently in use.
		 *       ***NOTE**: Auto-incrementing a column only works when this column is the primary key and no other columns are primary keys!*
		 *  - **"foreign_key"**: Enforce an "exist" relationship between tables by setting this variable to `foreign_table.foreign_column`. In other words, when adding an additional row, the column value should be an existing value as found in the column with name `foreign_column` of the table with name `foreign_table`.
		 *       ***NOTE**: Availability of foreign keys has to be enabled by setting the `foreign_keys`-variable to true BEFORE opening the database.*
		 *  **Example usage**:
		 *
		 *  For more concrete usage examples see the `database.gd`-file as found [url=https://github.com/2shady4u/godot-sqlite/blob/master/demo/database.gd]here[url].
		 */
		create_table(table_name: string, table_data: GDictionary): boolean;

		/** Drop the table with name `table_name`. This method is equivalent to the following query:
		 */
		drop_table(table_name: string): boolean;

		/** Backup the current database to a path, see [url=https://www.sqlite.org/backup.html]here[/url]. This feature is useful if you are using a database as your save file and you want to easily implement a saving mechanic. */
		backup_to(destination: string): boolean;

		/** Restore the current database from a path, see [url=https://www.sqlite.org/backup.html]here[/url]. This feature is useful if you are using a database as your save file and you want to easily implement a loading mechanic. Be warned that the original database will be overwritten entirely when restoring. */
		restore_from(source: string): boolean;

		/** Each key/value pair of the `row_dictionary`-variable defines the column values of a single row.
		 *  Columns should adhere to the table schema as instantiated using the `table_dictionary`-variable and are required if their corresponding **"not_null"**-column value is set to `True`.
		 */
		insert_row(table_name: string, row_data: GDictionary): boolean;

		/** Insert multiple rows into the given table. The `row_array` input argument should be an array of dictionaries where each element is defined as in [method insert_row]. */
		insert_rows(table_name: string, row_array: GArray): boolean;

		/** Returns the results from the latest query **by value**; meaning that this property does not get overwritten by any successive queries. */
		select_rows(table_name: string, conditions: string, columns: GArray): GArray;

		/** With the `updated_row_dictionary`-variable adhering to the same table schema & conditions as the `row_dictionary`-variable defined previously. */
		update_rows(table_name: string, conditions: string, row_data: GDictionary): boolean;

		/** Delete all rows of the table that match the given conditions. */
		delete_rows(table_name: string, conditions: string): boolean;

		/** Bind a [url=https://www.sqlite.org/appfunc.html]scalar SQL function[/url] to the database that can then be used in subsequent queries. */
		create_function(function_name: string, callable: Callable, arguments_: int64): boolean;

		/** Drops all database tables and imports the database structure and content present inside of `import_path.json`. */
		import_from_json(import_path: string): boolean;

		/** Exports the database structure and content to `export_path.json` as a backup or for ease of editing. */
		export_to_json(export_path: string): boolean;

		/** Check if the given database connection is or is not in autocommit mode, see [url=https://sqlite.org/c3ref/get_autocommit.html]here[/url]. */
		get_autocommit(): int64;

		/** Check if the binary was compiled using the specified option, see [url=https://sqlite.org/c3ref/compileoption_get.html]here[/url].
		 *  Mostly relevant for checking if the [url=https://sqlite.org/fts5.html]SQLite FTS5 Extension[/url] is enabled, in which case the following lines can be used:
		 */
		compileoption_used(option_name: string): int64;

		/** [url=https://www.sqlite.org/c3ref/load_extension.html]Extension loading[/url] is disabled by default for security reasons. There are two ways to load an extension: C-API and SQL function. This method turns on both options.
		 *  SQL function `load_extension()` can only be used after enabling extension loading with this method. Preferably should be disabled after loading the extension to prevent SQL injections. Returns the SQLite return code.
		 */
		enable_load_extension(onoff: boolean): int64;

		/** Loads the extension in the given path. Does not require [method SQLite.enable_load_extension], as it only enables C-API during the call and disables it right after, utilizing the recommended extension loading method declared by the SQLite documentation ([url=https://www.sqlite.org/c3ref/load_extension.html]see[/url]). Returns the SQLite return code.
		 *  - **extension_path:** the path to the compiled binary of the extension
		 *  - **entrypoint:** the extension's entrypoint method (init function). It is defined in the .c file of the extension.
		 *  Example for loading the spellfix module:
		 */
		load_extension(extension_path: string, entrypoint?: string /* = 'sqlite3_extension_init' */): int64;

		/** Exposes the `sqlite3_last_insert_rowid()`-method to Godot as described [url=https://www.sqlite.org/c3ref/last_insert_rowid.html]here[/url].
		 *  Attempting to modify this variable directly is forbidden and throws an error.
		 */
		get last_insert_rowid(): int64;
		set last_insert_rowid(value: int64);

		/** The verbosity_level determines the amount of logging to the Godot console that is handy for debugging your (possibly faulty) SQLite queries.
		 *   ***NOTE:** [constant VERBOSE] and higher levels might considerably slow down your queries due to excessive logging.*
		 */
		get verbosity_level(): int64;
		set verbosity_level(value: int64);

		/** Enables or disables the availability of [url=https://www.sqlite.org/foreignkeys.html]foreign keys[/url] in the SQLite database. */
		get foreign_keys(): boolean;
		set foreign_keys(value: boolean);

		/** Enabling this property opens the database in read-only modus & allows databases to be packaged inside of the PCK. To make this possible, a custom [url=https://www.sqlite.org/vfs.html]VFS[/url] is employed which internally takes care of all the file handling using the Godot API. */
		get read_only(): boolean;
		set read_only(value: boolean);

		/** Path to the database, should be set before opening the database with `open_db()`. If no database with this name exists, a new one at the supplied path will be created. Both `res://` and `user://` keywords can be used to define the path. */
		get path(): string;
		set path(value: string);

		/** Contains the zErrMsg returned by the SQLite query in human-readable form. An empty string corresponds with the case in which the query executed succesfully. */
		get error_message(): string;
		set error_message(value: string);

		/** Default extension that is automatically appended to the `path`-variable whenever **no** extension is detected/given.
		 *   ***NOTE:** If database files without extension are desired, this variable has to be set to "" (= an empty string) as to skip this automatic procedure entirely.*
		 */
		get default_extension(): string;
		set default_extension(value: string);

		/** Contains the results from the latest query **by value**; meaning that this property is safe to use when looping successive queries as it does not get overwritten by any future queries. */
		get query_result(): GArray;
		set query_result(value: GArray);

		/** Contains the results from the latest query **by reference** and is, as a direct result, cleared and repopulated after every new query. */
		get query_result_by_reference(): GArray;
		set query_result_by_reference(value: GArray);
	}
  const proxy: {
    proxy_unwrap_value: <T>(value: T) => T;
  };
}

declare module "godot.worker" {
	import { GAny, GArray, Object as GObject } from 'godot.lib.api';

	class JSWorker {
		constructor(path: string);

		postMessage(message: any, transfer?: GArray | ReadonlyArray<NonNullable<GAny>>): void;
		terminate(): void;

		onready?: () => void;
		onmessage?: (message: any) => void;

		//TODO not implemented yet
		onerror?: (error: any) => void;

		/**
		 @deprecated Use onmessage to receive messages sent from postMessage() with transfers included.
		 * @param obj
		 */
		ontransfer?: (obj: GObject) => void;
	}

	// only available in worker scripts
	const JSWorkerParent: {
		onmessage?: (message: any) => void,

		close(): void,

		/**
		 * @deprecated Use the transfer parameter of postMessage() instead.
		 * @param obj
		 */
		transfer(obj: GObject): void,

		postMessage(message: any, transfer?: GArray | ReadonlyArray<NonNullable<GAny>>): void;

	} | undefined;
}
