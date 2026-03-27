import { EventListenerConstructorOptions } from '../../features/event-listener/event-listener.types';
import { TimeoutErrorOptions } from '../../features/timeout';
import { RequestHeaders, ServerBreakerOptions } from '../../features/server-breaker/server-breaker.types';

/**
 * Options that can be passed to an abortable request.
 */
export interface AbortableRequestOptions {
  /**
   * Optional headers to include in the request.
   */
  headers?: RequestHeaders;
}

/**
 * An abortable request function that receives an `AbortSignal` and request options,
 * and returns a `Promise` resolving to the response data of type `T`.
 *
 * @typeParam T - The expected type of the resolved data.
 * @param signal - An `AbortSignal` that can be used to cancel the request.
 * @param options - Additional options for the request (e.g., headers).
 * @returns A `Promise` that resolves with the data of type `T` or rejects with an error.
 *
 * @example
 * const fetchUsers: AbortableRequest<User[]> = (signal, options) => {
 *   return fetch('/api/users', { signal, headers: options.headers })
 *     .then(res => res.json());
 * };
 */
export type AbortableRequest<T> = (signal: AbortSignal, options: AbortableRequestOptions) => Promise<T>;

/**
 * Options for configuring a request attempt via the `try` method.
 */
export interface FnTryOptions {
  /**
   * When set to `true`, allows catching a canceled request error in a catch block.
   * When `false` (default), abort errors are handled internally and do not propagate
   * to the promise rejection (unless they are of type `'aborted'`).
   *
   * @default false
   */
  isErrorNativeBehavior?: boolean;
  /**
   * Request timeout configuration.
   * - If a number is provided, it is interpreted as milliseconds.
   * - If a `TimeoutErrorOptions` object is provided, it allows additional metadata.
   */
  timeout?: number | TimeoutErrorOptions;
  /**
   * If `true` (default) and the request returns a `Response` object (e.g., from `fetch`),
   * the response body is automatically parsed as JSON and the promise resolves with
   * the parsed data. If `false`, the raw `Response` is returned.
   *
   * @default true
   */
  unpackData?: boolean;
}

/**
 * Configuration options for creating an `Aborter` instance.
 * Combines options from `EventListenerConstructorOptions` and `ServerBreakerOptions`.
 */
export interface AborterOptions
  extends
    Pick<EventListenerConstructorOptions, 'onAbort' | 'onStateChange'>,
    Pick<ServerBreakerOptions, 'interruptionsOnServer'> {}
