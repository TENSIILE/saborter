/* eslint-disable no-param-reassign */
import * as Types from './reusable-aborter.types';

/**
 * Manages a reusable AbortSignal that can be reset after an abort.
 *
 * The `ReusableAborter` wraps an `AbortController` and overrides the `addEventListener`
 * and `removeEventListener` methods of its signal to capture all non‑once listeners.
 * When `.abort()` is called, the current controller is aborted, a new controller is created,
 * and all captured listeners are re‑attached to the new signal. This allows the same
 * logical signal to be reused across multiple abort cycles.
 *
 * @example
 * const aborter = new ReusableAborter();
 * const signal = aborter.signal;
 *
 * signal.addEventListener('abort', () => console.log('Aborted!'));
 * aborter.abort('first'); // logs "Aborted!"; signal is now aborted
 *
 * // The signal is automatically replaced with a fresh one
 * signal.addEventListener('abort', () => console.log('Second abort'));
 * aborter.abort('second'); // logs "Aborted!" and "Second abort"
 */
export class ReusableAborter {
  /**
   *  @protected Current AbortController. Replaced on each abort.
   */
  protected abortController = new AbortController();

  /**
   * Stores the original `addEventListener` and `removeEventListener` methods
   * of the initial `AbortSignal` to call them after overriding.
   *
   * @private
   */
  protected originalSignalApi = {} as Types.OriginalSignalApi;

  /**
   * List of listener registration parameters that should be preserved across resets.
   * Only non‑once listeners are stored.
   *
   * @private
   */
  protected originalSignalListenerParams: Types.OriginalSignalListenerParams[] = [];

  constructor() {
    const abortController = new AbortController();

    this.saveSignalListenersApi(abortController.signal);

    this.assignSignalListeners(abortController.signal);

    this.abortController = abortController;
  }

  /**
   * Overrides the `addEventListener` and `removeEventListener` methods of the target signal.
   *
   * @param targetSignal - The `AbortSignal` whose methods will be overridden.
   *
   * @protected
   */
  protected assignSignalListeners = (targetSignal: AbortSignal): void => {
    const that = this;

    targetSignal.addEventListener = function <K extends keyof AbortSignalEventMap>(
      type: K,
      listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ) {
      if (typeof listener !== 'function') {
        throw new TypeError('listener is not a function');
      }

      if (typeof options === 'object' && options?.once) {
        return that.originalSignalApi.addEventListener.call(this, type, listener, options);
      }

      that.originalSignalListenerParams.push({ type, listener, options });
      that.originalSignalApi.addEventListener.call(this, type, listener, options);
    };

    targetSignal.removeEventListener = function <K extends keyof AbortSignalEventMap>(
      type: K,
      listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
      options?: boolean | EventListenerOptions
    ) {
      if (typeof listener !== 'function') {
        throw new TypeError('listener is not a function');
      }

      that.originalSignalListenerParams = that.originalSignalListenerParams.filter(
        (arg) => arg.type !== type && arg.listener !== listener
      );
      that.originalSignalApi.removeEventListener.call(this, type, listener, options);
    };
  };

  /**
   * Stores the original `addEventListener` and `removeEventListener` methods
   * from the given `AbortSignal` into `originalSignalApi`.
   *
   * @param originalSignal - The signal whose native methods are to be saved.
   *
   * @protected
   */
  protected saveSignalListenersApi = (originalSignal: AbortSignal): void => {
    this.originalSignalApi.addEventListener = originalSignal.addEventListener;
    this.originalSignalApi.removeEventListener = originalSignal.removeEventListener;
  };

  /**
   * Restores all previously captured listeners onto a new target signal.
   * Copies the `onabort` handler and adds every listener stored in
   * `originalSignalListenerParams`. After restoration, it reapplies the method overrides
   * to the target signal.
   *
   * @param originalSignal - The old (already aborted) signal whose `onabort` handler is copied.
   * @param targetSignal   - The new signal that will receive the recovered listeners.
   *
   * @protected
   */
  protected recoverySignalListeners = (originalSignal: AbortSignal, targetSignal: AbortSignal): void => {
    targetSignal.onabort = originalSignal.onabort;
    this.originalSignalListenerParams.forEach(({ type, listener, options }) => {
      targetSignal.addEventListener(type, listener, options);
    });

    this.assignSignalListeners(targetSignal);
  };

  /**
   * Returns the current usable `AbortSignal`.
   * The signal is automatically patched to capture listeners.
   */
  public get signal(): AbortSignal {
    return this.abortController.signal;
  }

  /**
   * Aborts the current signal and resets the internal controller.
   *
   * - The current `AbortController` is aborted with the given reason.
   * - A new `AbortController` is created.
   * - All previously captured non‑once listeners are recovered onto the new signal.
   * - The internal controller reference is updated to the new one.
   *
   * @param reason - Optional reason to pass to `abort()`.
   */
  public abort = (reason?: any): void => {
    this.abortController.abort(reason);

    const abortController = new AbortController();

    this.recoverySignalListeners(this.abortController.signal, abortController.signal);

    this.abortController = abortController;
  };
}
