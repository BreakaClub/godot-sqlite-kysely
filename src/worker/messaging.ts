import { GodotSQLiteKyselyConnectionConfig } from '../types';
import { GArray } from 'godot.lib.api';
import { QueryResult } from 'kysely';

export type InitializeWorkerRequest = {
  type: 'initialize';
  config: GodotSQLiteKyselyConnectionConfig;
}

export type QueryWorkerRequest = {
  type: 'query';
  id: number;
  query: string;
  parameters?: readonly unknown[] | GArray;
}

export type TerminateWorkerRequest = {
  type: 'terminate';
}

export type WorkerRequest = InitializeWorkerRequest | QueryWorkerRequest | TerminateWorkerRequest;

export type InitializedWorkerResponse = {
  type: 'initialized';
}

export type InitializationErrorWorkerResponse = {
  type: 'initializationError';
  message: string;
}

export type QueryResultWorkerResponse = {
  type: 'queryResult';
  id: number;
  result: QueryResult<unknown>;
}

export type QueryErrorWorkerResponse = {
  type: 'queryError';
  id: number;
  message: string;
}


export type TerminatedWorkerResponse = {
  type: 'terminated';
}

export type WorkerResponse = InitializedWorkerResponse | InitializationErrorWorkerResponse | QueryResultWorkerResponse | QueryErrorWorkerResponse | TerminatedWorkerResponse;
