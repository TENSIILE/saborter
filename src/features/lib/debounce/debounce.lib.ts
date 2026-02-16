import { setTimeoutAsync } from '../set-timeout-async';
import { AbortError } from '../../abort-error';

/**
 * Creates a debounced function that delays invoking the provided handler
 * until after a specified timeout has elapsed since the last time the
 * debounced function was called. The debounced function accepts an
 * `AbortSignal` to allow cancellation.
 *
 * This is a **leading‑edge** debounce: the first call within a burst
 * schedules the execution, and any subsequent calls reset the timer.
 * The debounced function returns a `Promise` that resolves with the
 * handler's result or rejects if the handler throws or the signal is aborted.
 *
 * **Error handling**:
 * - If the underlying `setTimeoutAsync` throws an `AbortError`, the error is
 *   enriched with a `cause` (a new `AbortError` containing the original error)
 *   and its `initiator` property is set to `'debounce'` before being rethrown.
 * - Any other error is rethrown unchanged.
 *
 * @template R - The return type of the handler function.
 * @param {Parameters<typeof setTimeoutAsync<R>>['0']} handler -
 *        The function to debounce.The function will be called either without arguments
 *        or with the `AbortSignal` argument after the timeout expires.
 * @param {number} timeout -
 *        The debounce delay in milliseconds.
 * @returns {(signal: AbortSignal) => Promise<R>} -
 *          A function that, when called, starts/resets the debounce timer
 *          and returns a promise. The promise resolves with the handler's
 *          result or rejects with an enriched `AbortError` (if the signal
 *          was aborted) or the original error.
 *
 * @example
 * // Debounce an API call
 * const debouncedFetch = debounce((signal) => fetch('/api/search', { signal }), 300);
 *
 * const controller = new AbortController();
 * debouncedFetch(controller.signal)
 *   .then(response => response.json())
 *   .catch(err => {
 *     if (err.name === 'AbortError') {
 *       console.log('Debounced call aborted by:', err.initiator); // 'debounce'
 *     }
 *   });
 *
 * @see setTimeoutAsync – The underlying delay mechanism.
 */
export const debounce = <R>(
  handler: Parameters<typeof setTimeoutAsync<R>>['0'],
  timeout: number
): ((signal: AbortSignal) => Promise<R>) => {
  return (signal: AbortSignal) => {
    try {
      return setTimeoutAsync(handler, timeout, { signal });
    } catch (error) {
      if (error instanceof AbortError) {
        error.cause = new AbortError(error.message, { ...error, cause: error });
        error.initiator = debounce.name;

        throw error;
      }

      throw error;
    }
  };
};
