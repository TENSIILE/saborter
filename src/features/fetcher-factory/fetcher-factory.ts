import * as Types from './fetcher-factory.types';
import { defaultFetcher } from './fetcher-factory.lib';
import { overrideSymbol } from './fetcher-factory.constants';
import * as Utils from './fetcher-factory.utils';

/**
 * A factory that creates abortable fetchers with support for request cancellation,
 * notification of request interruptions on the server, and automatic request ID generation.
 *
 * The `FetcherFactory` wraps a fetcher function (or a factory that returns a fetcher)
 * and provides an abort signal, headers with a unique `x-request-id`, and the ability
 * to notify the server when a request is interrupted (using `sendBeacon` or `fetch`).
 *
 * @template Factory - The type of the fetcher factory. Defaults to `Types.FetcherFactory<Types.DefaultFetcherFactoryArgs>`.
 *
 * @example
 * // Create a factory with a custom fetcher
 * const factory = new FetcherFactory({
 *   fetcher: (url, options) => {
 *      return async (ctx) => {
 *          const response = await fetch(url, { ...options, signal: ctx.signal, headers:ctx.headers });
 *          return await response.json();
 *      }
 *   },
 *   signal: controller.signal,
 *   interruptionsOnServer: { hasInterruptRequests: true }
 * });
 *
 * // Get the abortable fetcher
 * const fetcher = factory.fetcher;
 *
 * // Use it like a normal fetch, but with automatic abort and headers
 * fetcher('/api/data')
 *   .then(response => response.json())
 *   .catch(err => console.error('Request failed or aborted'));
 *
 * // Notify the server if the request was interrupted
 * factory.notifyServerOfInterruption();
 */
export class FetcherFactory<
  Factory extends Types.FetcherFactory<[any?, ...any[]]> = Types.FetcherFactory<Types.DefaultFetcherFactoryArgs>
> {
  /**
   * The underlying fetcher factory.
   *
   * @protected
   */
  protected fetcherFactory: Factory;

  /**
   * Configuration for server interruption notification.
   *
   * @protected
   */
  protected interruptionsOnServer?: Types.InterruptionsOnServer;

  /**
   * Metadata object that holds headers and response.
   *
   * @protected
   */
  protected meta: Types.RequestMeta = {};

  /**
   * Request map containing metadata.
   *
   * @private
   */
  private requestsMetaMap: Map<string, Types.RequestMeta> = new Map();

  /**
   * Cleanup callback called when the request completes.
   *
   * @private
   */
  private pendingRequestMetadataCleanup?: VoidFunction;

  constructor(options: Types.FetcherFactoryOptions<Factory>) {
    this.fetcherFactory = (options.fetcher ?? defaultFetcher) as Factory;
    this.meta.signal = options.signal;

    if (typeof window !== 'undefined') {
      const {
        endpointName = '/api/cancel',
        basePath = window.location.origin,
        ...restInterruptionsOnServer
      } = options.interruptionsOnServer ?? {};
      this.interruptionsOnServer = { ...restInterruptionsOnServer, endpointName, basePath };

      if (this.interruptionsOnServer.hasInterruptRequests) {
        options.listeners?.state.subscribe((state) => {
          if (state === 'aborted' || state === 'fulfilled' || state === 'rejected') {
            this.pendingRequestMetadataCleanup?.();
          }
        });
      }
    }
  }

  /**
   * Creates the context object that is passed to the fetcher.
   * The context contains headers, the abort signal, and a `save` method to store the response.
   *
   * @returns {Types.FetcherFactoryContext} The context object.
   *
   * @protected
   */
  protected createContext = (): Types.FetcherFactoryContext => {
    this.meta.headers = Utils.createHeaders();

    if (!this.meta.signal) {
      throw new ReferenceError('No instance of AbortSignal found!');
    }

    return {
      save: (data: Types.FetcherFactoryContextSaveData) => {
        this.meta.url = data.url;
        this.meta.method = data.method;
        this.requestsMetaMap.set(Utils.getRequestUrlByMeta(this.meta), this.meta);

        this.pendingRequestMetadataCleanup = () => {
          if (!this.meta.url) return;
          this.requestsMetaMap.delete(Utils.getRequestUrlByMeta(this.meta));
        };
      },
      headers: this.meta.headers,
      signal: this.meta.signal
    };
  };

  /**
   * Updates the abort signal used for subsequent requests.
   *
   * @param {AbortSignal} signal - The new abort signal.
   */
  public setAbortSignal = (signal: AbortSignal): void => {
    this.meta.signal = signal;
  };

  /**
   * Returns the abortable fetcher function.
   *
   * If the internal `fetcherFactory` has an `overrideSymbol` property, the factory is called
   * with no arguments and the resulting fetcher is invoked with the context.
   * Otherwise, the factory is called with the provided arguments, and then the resulting
   * function is invoked with the context.
   *
   * @returns {Factory extends typeof overrideSymbol
   *            ? ReturnType<ReturnType<Factory>>
   *            : <Result>(...args: Parameters<Factory>) => Result}
   *          A function that can be called like a normal fetcher, but automatically receives
   *          the abort signal and headers.
   *
   * @example
   * const fetcher = factory.fetcher;
   * // Use with standard fetch-like arguments
   * fetcher('/api/users').then(handleResponse);
   */
  public get fetcher(): Factory extends typeof overrideSymbol
    ? ReturnType<ReturnType<Factory>>
    : <Result>(...args: Parameters<Factory>) => Result {
    const context = this.createContext();

    if (!this.fetcherFactory[overrideSymbol]) {
      // @ts-expect-error
      return (...args: Parameters<Factory>) => {
        return this.fetcherFactory(...args)(context);
      };
    }

    return this.fetcherFactory([])(context);
  }

  /**
   * Notifies the server that a request was interrupted (e.g., because the user navigated away).
   * This method sends the request ID (from the last request) to a server endpoint.
   */
  public notifyServerOfInterruption = (): void => {
    if (this.interruptionsOnServer?.hasInterruptRequests) {
      const url = `${this.interruptionsOnServer.basePath}${this.interruptionsOnServer.endpointName}`;

      this.requestsMetaMap.forEach((meta) => {
        const blob = new Blob([meta.headers?.['x-request-id'] ?? ''], { type: 'text/plain' });

        if (navigator && 'sendBeacon' in navigator && typeof navigator.sendBeacon === 'function') {
          navigator.sendBeacon(url, blob);

          return;
        }

        fetch(url, {
          method: 'POST',
          body: blob
        });
      });
    }
  };
}
