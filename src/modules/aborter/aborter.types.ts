import { EventListenerOptions } from './event-listener/event-listener.types';
import { TimeoutOptions } from '../../features/timeout';

export type AbortRequest<T> = (signal: AbortSignal) => Promise<T>;

export interface TryMethodOptions {
  /**
   * Returns the ability to catch a canceled request error in a catch block.
   * @default false
   */
  isErrorNativeBehavior?: boolean;
  /**
   * Automatic request cancellation setting field.
   */
  timeout?: TimeoutOptions;
  /**
   * The request name field. Required for invoking multiple requests from a single Aborter instance.
   */
  name?: string;
}

export interface AbortMethodOptions {
  /**
   * Additional reason or data associated with the interrupt.
   */
  reason?: any;
  /**
   * A field indicating which request should be terminated by its name.
   */
  abortByName?: string | string[];
}

export interface AbortByRequestNameMethodOptions extends Pick<AbortMethodOptions, 'reason'> {}

export interface AborterOptions extends Pick<EventListenerOptions, 'onAbort'> {}
