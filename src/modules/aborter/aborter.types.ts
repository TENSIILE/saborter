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

export interface AborterOptions extends Pick<EventListenerConstructorOptions, 'onAbort' | 'onStateChange'> {}
