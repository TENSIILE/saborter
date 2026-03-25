import { overrideSymbol } from './fetcher-factory.constants';
import { EventListener } from '../event-listener';

/**
 * Headers sent with every abortable fetch request.
 * Includes a unique request ID and cache-control headers.
 */
export interface FetchableRequestHeaders {
  /**
   * Unique identifier for the request, generated on the client.
   */
  'x-request-id': string;
  /**
   * Disables caching.
   */
  'Cache-Control': 'no-cache';
  /**
   * Disables caching for HTTP/1.0.
   */
  Pragma: 'no-cache';
}

/**
 * Data saved by the `save` method of the fetcher context.
 * Contains the final URL (after possible redirects) and the HTTP method used.
 */
export interface FetcherFactoryContextSaveData {
  /**
   * Request URL.
   */
  url: string;
  /**
   * The HTTP method used (e.g., 'GET', 'POST').
   */
  method: string;
}

/**
 * Context object passed to the fetcher function.
 * Provides access to headers, an abort signal, and a callback to save request metadata.
 */
export interface FetcherFactoryContext {
  /**
   * Callback to store metadata about the request after it completes.
   * @param data - The metadata to save.
   */
  save: (data: FetcherFactoryContextSaveData) => void;
  /**
   * Abort signal that can be used to cancel the request.
   */
  signal: AbortSignal;
  /**
   * Headers that must be included in the request.
   */
  headers: FetchableRequestHeaders;
}

/**
 * Metadata describing a request.
 */
export interface RequestMeta {
  /**
   * Request URL.
   */
  url?: string;
  /**
   * HTTP method.
   */
  method?: string;
  /**
   * Headers used in the request.
   */
  headers?: FetchableRequestHeaders;
  /**
   * Abort signal associated with the request.
   */
  signal?: AbortSignal;
}

/**
 * A factory that creates a fetcher function (a function that accepts a context
 * and returns a promise). The factory can be decorated with the `overrideSymbol`
 * to indicate that it should be treated specially by the `FetcherFactory` class.
 *
 * @template Args - The arguments expected by the factory.
 */
export interface FetcherFactory<Args extends any[]> {
  /**
   * Creates a fetcher function that will be invoked with a context.
   * @param args - Arguments passed to the factory.
   * @returns A function that, when given a context, returns a promise.
   */
  (...args: Args): (context: FetcherFactoryContext) => any extends infer P ? P : never;
  /**
   * Optional marker property used to identify factories that should be overridden.
   * If present, the factory is called with an empty array and the resulting
   * function is invoked with the context.
   */
  [overrideSymbol]?: typeof overrideSymbol;
}

/**
 * Argument types for the default fetcher factory.
 * The default fetcher expects a URL and optional fetch options.
 */
export type DefaultFetcherFactoryArgs = [url: string, init?: RequestInit];

/**
 * Configuration for notifying the server when a request is interrupted.
 */
export interface InterruptionsOnServer {
  /**
   * Whether to notify the server on interruption.
   */
  hasInterruptRequests?: boolean;
  /**
   *  Base path of the server (e.g., `window.location.origin`).
   */
  basePath?: string;
  /**
   * Endpoint path where the interruption notification is sent.
   */
  endpointName?: string;
}

/**
 * Options for creating a `FetcherFactory` instance.
 *
 * @template Factory - The type of fetcher factory to use.
 */
export interface FetcherFactoryOptions<Factory extends FetcherFactory<[]>> {
  /**
   * Abort signal that will be passed to all requests created by this factory.
   */
  signal: AbortSignal;
  /**
   * Optional event listener for state changes.
   * @instance EventListener
   */
  listeners?: EventListener;
  /**
   * The fetcher factory to use. Defaults to the built-in `defaultFetcher`.
   */
  fetcher?: Factory;
  /**
   * Configuration for server interruption notifications.
   */
  interruptionsOnServer?: InterruptionsOnServer;
}
