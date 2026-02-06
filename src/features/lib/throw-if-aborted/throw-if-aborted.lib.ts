import { AbortError } from '../../abort-error';

/**
 * Throws an AbortError if the provided AbortSignal is aborted.
 * This utility function is useful for manually checking abortion status
 * in operations that don't automatically handle AbortSignal.
 *
 * @param {AbortSignal} signal - The AbortSignal to check for abortion.
 * @returns {void}
 * @throws {AbortError} Throws an AbortError if the signal is aborted.
 *         If the signal has a reason that is already an AbortError, it throws that reason.
 *         Otherwise, it creates a new AbortError with the original reason as context.
 *
 * @example
 * // Manual check in a loop
 * const processItems = (items, signal) => {
 *   for (const item of items) {
 *     throwIfAborted(signal); // Check before each iteration
 *     // Process item...
 *   }
 * }
 *
 * @example
 * // Check before starting an operation
 * const fetchData = (signal) => {
 *   throwIfAborted(signal);
 *   return fetch('/api/data', { signal });
 * }
 */
export const throwIfAborted = (signal: AbortSignal): never | void => {
  if (!signal.aborted) return;

  if (signal.reason instanceof AbortError) {
    throw signal.reason;
  }

  throw new AbortError('signal is aborted without message', { reason: signal.reason, initiator: 'system' });
};
