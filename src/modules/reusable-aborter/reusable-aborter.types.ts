/**
 * Represents the original, native `addEventListener` and `removeEventListener` methods
 * of an `AbortSignal`. Used internally by {@link ReusableAborter} to store references
 * to the unmodified methods after overriding them.
 */
export interface OriginalSignalApi {
  /**
   * Native AbortSignal `addEventListener` method.
   */
  addEventListener: AbortSignal['addEventListener'];
  /**
   * Native AbortSignal `removeEventListener` method.
   */
  removeEventListener: AbortSignal['removeEventListener'];
}

/**
 * Represents the parameters used when registering a non‑once event listener
 * on an `AbortSignal`. Stored by {@link ReusableAborter} to reattach these listeners
 * after the signal is reset.
 */
export interface OriginalSignalListenerParams {
  /**
   * Event type (e.g., `'abort'`).
   */
  type: Parameters<AbortSignal['addEventListener']>['0'];
  /**
   * Callback function.
   */
  listener: Parameters<AbortSignal['addEventListener']>['1'];
  /**
   * Listener options (may be `undefined`, a boolean, or an `AddEventListenerOptions` object).
   */
  options: Parameters<AbortSignal['addEventListener']>['2'];
}

/**
 * Configuration for which types of listeners should be "attracted" (synchronized)
 * when a reusable abort signal is reset.
 */
export interface AttractListeners {
  /**
   * Whether to preserve event listeners added via `addEventListener`.
   */
  eventListeners: boolean;
  /**
   * Whether to preserve the `onabort` handler.
   */
  onabort: boolean;
}

/**
 * Properties for configuring a `ReusableAborter` instance.
 */
export interface ReusableAborterProps {
  /**
   * Determines which listeners are carried over when the abort signal is reset.
   * - If `true`, all listeners (both `onabort` and event listeners) are preserved.
   * - If `false`, no listeners are preserved.
   * - If an {@link AttractListeners} object, specific listener types can be enabled/disabled individually.
   */
  attractListeners?: boolean | AttractListeners;
}
