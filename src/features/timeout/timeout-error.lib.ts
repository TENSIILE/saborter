import { AbortError } from '../abort-error';
import { TimeoutError } from './timeout-error';

/**
 * Checks whether a given error is a timeout error that originated from an abort due to timeout.
 *
 * The function verifies three conditions:
 * 1. The error is an instance of `AbortError`.
 * 2. The error's `initiator` property equals `'timeout'`.
 * 3. The error's `cause` property is an instance of `TimeoutError`.
 *
 * This is useful for distinguishing timeout‑induced abort errors from other
 * types of abort errors (e.g., user‑initiated or system cancellations).
 *
 * @param error - The error object to inspect.
 * @returns `true` if the error represents a timeout abort, otherwise `false`.
 *
 * @example
 * const abortError = new AbortError('Request timed out', {
 *   initiator: 'timeout',
 *   cause: new TimeoutError('Timeout', { ms: 5000 })
 * });
 * isTimeoutError(abortError); // true
 *
 * @example
 * const userAbort = new AbortError('Cancelled by user', { initiator: 'user' });
 * isTimeoutError(userAbort); // false
 */
export const isTimeoutError = (error: any): error is TimeoutError => {
  return error instanceof AbortError && error.initiator === 'timeout' && error.cause instanceof TimeoutError;
};
