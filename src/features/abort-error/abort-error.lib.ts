import {
  ABORT_ERROR_NAME,
  ERROR_CAUSE_PATH_MESSAGE,
  ERROR_CAUSE_PATH_NAME,
  ABORT_SUBSTRING
} from './abort-error.constants';
import { AbortError } from './abort-error';
import { Utils } from '../../shared';

const checkErrorCause = (error: unknown) =>
  Utils.get(error, ERROR_CAUSE_PATH_NAME) === ABORT_ERROR_NAME ||
  Utils.get<unknown, string>(error, ERROR_CAUSE_PATH_MESSAGE)?.includes(ABORT_SUBSTRING);

/**
 * Determines whether a given error is an AbortError.
 *
 * @param {any} error - The value to check.
 * @returns {error is Error} `true` if the error is identified as an AbortError, otherwise `false`.
 *
 * @example
 * // Direct instance
 * const abortError = new AbortError('Aborted');
 * isAbortError(abortError); // true
 *
 * @example
 * // Object with correct name
 * const fakeAbort = { name: 'AbortError', message: 'Cancelled' };
 * isAbortError(fakeAbort); // true (if ABORT_ERROR_NAME === 'AbortError')
 *
 * @example
 * // Error with message containing 'abort'
 * const error = new Error('The operation was aborted');
 * isAbortError(error); // true
 *
 * @example
 * // Error with cause chain
 * const inner = new AbortError('Inner abort');
 * const outer = new Error('Wrapper', { cause: inner });
 * isAbortError(outer); // true (if checkErrorCause traverses the cause)
 */
export const isAbortError = (error: any): error is Error => {
  if (error instanceof AbortError) {
    return true;
  }

  if (Utils.isObject(error) && 'name' in error && error.name === ABORT_ERROR_NAME) {
    return true;
  }

  if (error?.message?.includes(ABORT_SUBSTRING)) {
    return true;
  }

  return !!checkErrorCause(error);
};
