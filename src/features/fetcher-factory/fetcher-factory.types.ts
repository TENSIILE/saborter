import { overrideSymbol } from './fetcher-factory.lib';

export interface AbortableFetcherContext {
  save: (data: any) => void;
  signal: AbortSignal;
  headers?: HeadersInit;
}

export interface AbortableMeta {
  headers?: HeadersInit;
  response?: Response;
}

export interface FetcherFactory<Args extends any[]> {
  (...args: Args): (context: AbortableFetcherContext) => any extends infer P ? P : never;
  [overrideSymbol]?: typeof overrideSymbol;
}

export type DefaultFetcherFactoryArgs = [url: string, init?: RequestInit];

export interface FetcherFactoryProps<Factory extends FetcherFactory<[]>> {
  signal: AbortSignal;
  fetcher?: Factory;
}
