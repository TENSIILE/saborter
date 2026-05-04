import { AbortError } from '../abort-error';
import { OnStateChangeCallback } from '../state-observer';

/**
 * Map of event names to their corresponding event data types.
 */
export interface EventMap {
  /** Event triggered when an operation is aborted. */
  aborted: AbortError;
  /** Event triggered when an operation is cancelled. */
  cancelled: AbortError;
  /** Event triggered when an operation completes successfully. */
  fulfilled: any;
  /** Event triggered when an operation fails with an error. */
  rejected: Error;
  /** The event is triggered when the operation completes, both with an error and successfully. */
  settled:
    | {
        status: 'fulfilled';
        value: any;
      }
    | { status: 'rejected'; reason: Error };
}

/**
 * Union type of all possible event names.
 */
export type EventListenerType = keyof EventMap;

/**
 * Callback signature for a specific event type.
 *
 * @template T - The event type (e.g., `'aborted'`, `'cancelled'`).
 * @param event - The event data, if any.
 */
export type EventCallback<T extends EventListenerType> = EventMap[T] extends undefined
  ? () => void
  : (event: EventMap[T]) => void;

/**
 * Configuration for attaching an event listener.
 */
export interface EventListenerOptions {
  /** If `true`, the listener will be called at most once and then removed. */
  once?: boolean;
}

/**
 * Callback for the `aborted` event.
 * @param error - The abort error.
 */
export type OnAbortCallback = (error: AbortError) => void;

/**
 * Options for constructing an `EventListener` instance.
 */
export interface EventListenerConstructorOptions {
  /**
   *  Callback invoked when the `aborted` and `cancelled` event occurs.
   */
  onAbort?: OnAbortCallback;
  /**
   * Callback invoked when the observable state changes.
   */
  onStateChange?: OnStateChangeCallback;
  /**
   * Callback function called when `aborted` events occur.
   */
  onInterrupt?: OnAbortCallback;
  /**
   * Callback function called when `cancelled` events occur.
   */
  onCancel?: OnAbortCallback;
}

/**
 * Wrapper structure for storing original and optionally wrapped listeners.
 *
 * @template K - The event type.
 */
export interface ListenerWrapper<K extends EventListenerType> {
  /** The original listener function provided by the user. */
  originalListener: (event: EventMap[K]) => any;
  /** An optional wrapped version of the listener (e.g., for `once` behavior). */
  wrappedListener?: (event: EventMap[K]) => any;
}
