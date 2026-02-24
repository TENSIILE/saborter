import { isAbortError, AbortError } from '../../abort-error';

/**
 * Catches and silences AbortError while re-throwing all other errors.
 * This function is useful in scenarios where abort errors are expected
 * and should be handled silently, while other errors should propagate.
 *
 * @param {any} error - The error to check and potentially re-throw.
 * @param {Object} [options] - Configuration options.
 * @param {boolean} [options.strict=false] - When true, only catches errors
 *        that are direct instances of AbortError (using instanceof check).
 *        When false, uses the more lenient isAbortError check.
 * @returns {void}
 * @throws {Error} Re-throws any error that is not determined to be an AbortError
 *         based on the specified mode.
 *
 * @example
 * // Silencing abort errors in async operations
 * try {
 *   await fetchWithTimeout(url, { signal });
 * } catch (error) {
 *   catchAbortError(error); // Only re-throws non-abort errors
 *   // If we get here, it was an abort error and we can ignore it
 * }
 *
 * @example
 * // Using strict mode for type safety
 * try {
 *   await someOperation(signal);
 * } catch (error) {
 *   catchAbortError(error, { strict: true });
 *   // Handle or ignore the abort
 * }
 */
export const catchAbortError = (error: any, { strict = false }: { strict?: boolean } = {}): never | void => {
  if (strict) {
    if (error instanceof AbortError) {
      return;
    }

    throw error;
  }

  if (isAbortError(error)) {
    return;
  }

  throw error;
};
