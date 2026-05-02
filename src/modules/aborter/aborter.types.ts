import { EventListenerConstructorOptions } from '../../features/event-listener/event-listener.types';
import { EventListener } from '../../features/event-listener/event-listener';
import { TimeoutErrorOptions } from '../../features/timeout';
import { AbortableHeaders } from '../../features/server-breaker/server-breaker.types';
import { disposeSymbol } from './aborter.constants';

/**
 * Options that can be passed to an abortable request.
 */
export interface AbortableRequestOptions {
  /**
   * Additional headers to include in the request to interrupt server operations.
   */
  headers?: AbortableHeaders;
  /**
   * Arguments for the request callback.
   */
  args?: any[];
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
  /**
   * Enables or disables automatic injection of the `Aborter` context for `fetch` and `XMLHttpRequest` calls.
   *
   * @default true
   */
  provision?: boolean;
  /**
   * Delays the call to the `try` method in milliseconds.
   */
  debounce?: number;
}

/**
 * Configuration options for creating an `Aborter` instance.
 */
export interface AborterOptions<AborterInstance> extends Pick<
  EventListenerConstructorOptions,
  'onAbort' | 'onStateChange'
> {
  /**
   * Callback invoked immediately after the `Aborter` instance is created.
   *
   * @param instance - The newly created `Aborter` instance.
   *
   * @example
   * const options: AborterOptions<Aborter> = {
   *   onInit: (instance) => {
   *     console.log('Aborter created', instance);
   *   }
   * };
   */
  onInit?: (instance: AborterInstance) => void;
  /**
   * Flag regulating the activation of interruption of work on the server.
   *
   * @example
   * ```
   * const aborter = new Aborter({ interruptionOnServer: true });
   *
   * const result = await aborter.try(async (signal, { headers }) => {
   *    const response = await fetch('/api/', { signal, headers });
   *    return respose.json();
   * });
   * ```
   *
   * If the value is `false`, the `headers` object will be an empty object.
   *
   * @default false
   */
  interruptionOnServer?: boolean;
}

/**
 * Manages a single abortable asynchronous request.
 *
 * @internal
 */
export interface AborterType {
  listeners: EventListener;
  aborted: boolean;
  signal: AbortSignal;
  try<R = Response>(request: AbortableRequest<Response>, options?: FnTryOptions): Promise<R>;
  try<R>(request: AbortableRequest<R>, options?: FnTryOptions): Promise<R>;
  abort(reason?: any): void;
  abortWithRecovery(reason?: any): AbortController;
  [disposeSymbol](): void;
}
