import { EventListenerOptions } from './event-listener/event-listener.types';

export type AbortRequest<T> = (signal: AbortSignal) => Promise<T>;

export interface FnTryOptions {
  /**
   * Returns the ability to catch a canceled request error in a catch block.
   * @default false
   */
  isErrorNativeBehavior?: boolean;
  /**
   *
   */
  timeout?: {
    hasThrow?: boolean;
    ms: number;
  };
}

export interface AborterOptions extends Pick<EventListenerOptions, 'onAbort'> {}
