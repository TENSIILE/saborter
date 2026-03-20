import { EventListenerConstructorOptions } from '../../features/event-listener/event-listener.types';
import { TimeoutErrorOptions } from '../../features/timeout';

export type AbortableRequest<T> = (signal: AbortSignal) => Promise<T>;

export interface FnTryOptions {
  /**
   * Returns the ability to catch a canceled request error in a catch block.
   * @default false
   */
  isErrorNativeBehavior?: boolean;
  /**
   * Automatic request cancellation setting field.
   */
  timeout?: number | TimeoutErrorOptions;
  /**
   * Automatically unwraps JSON if the `try` method receives a `Response` instance, for example, returns `fetch()`.
   * @default true
   */
  unpackData?: boolean;
}

export interface AbortableFetcherContext {
  save: (data: any) => void;
  signal: AbortSignal;
  headers?: HeadersInit;
}

export interface AbortableMeta {
  headers?: HeadersInit;
  response?: Response;
}

export type FetcherFactory<Args extends any[], Return = unknown> = (
  ...args: Args
) => (context: AbortableFetcherContext) => Return;

export type DefaultFetcherFactoryArgs = [url: string, init?: RequestInit];

export interface AborterOptions<Args extends any[], Return> extends Pick<
  EventListenerConstructorOptions,
  'onAbort' | 'onStateChange'
> {
  fetcher?: FetcherFactory<Args, Return>;
}
