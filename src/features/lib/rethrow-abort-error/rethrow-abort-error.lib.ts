import { AbortError, isAbortError } from '../../abort-error';

/**
 * Re-throws an error if it is an AbortError, with optional strict mode.
 * This function is useful for error handling patterns where you want to
 * propagate abort errors while handling other errors differently.
 *
 * @param {any} error - The error to check and potentially re-throw.
 * @param {Object} [options] - Configuration options.
 * @param {boolean} [options.isStrict=false] - When true, only re-throws if the error
 *        is an instance of AbortError (using instanceof check). When false, uses
 *        the more lenient isAbortError check which might recognize custom abort errors.
 * @returns {void}
 * @throws {AbortError} Re-throws the error if it is determined to be an AbortError
 *         based on the specified mode.
 *
 * @example
 * // Basic usage
 * try {
 *   await someOperation(signal);
 * } catch (error) {
 *   rethrowAbortError(error); // Only re-throws abort errors
 *   // Handle other errors here
 * }
 *
 * @example
 * // Strict mode
 * try {
 *   await fetchWithTimeout(url, { signal });
 * } catch (error) {
 *   rethrowAbortError(error, { isStrict: true });
 *   // Handle non-AbortError errors
 * }
 */
export const rethrowAbortError = (error: any, { isStrict = false }: { isStrict?: boolean } = {}): never | void => {
  if (isStrict) {
    if (error instanceof AbortError) {
      throw error;
    }

    return;
  }

  if (isAbortError(error)) {
    throw error;
  }
};
