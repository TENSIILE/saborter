import { EventListenerOptions } from '../../features/event-listener/event-listener.types';
import { TimeoutOptions } from '../../features/timeout';

export type AbortRequest<T> = (signal: AbortSignal) => Promise<T>;

export interface FnTryOptions {
  /**
   * Returns the ability to catch a canceled request error in a catch block.
   * @default false
   */
  isErrorNativeBehavior?: boolean;
  /**
   * Automatic request cancellation setting field.
   */
  timeout?: TimeoutOptions;
}

export interface AborterOptions extends Pick<EventListenerOptions, 'onAbort'> {}
