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
 * isAbortError(fakeAbort); // true
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
 * isAbortError(outer); // true
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

const CANNOT_BE_OVERRIDDEN = ['cause', 'timestamp', 'stack', 'name'] satisfies Array<keyof AbortError>;

/**
 * Creates a new `AbortError` instance that is a copy of the original,
 * allowing selective override of its properties.
 *
 * The original error is set as the `cause` of the new error, preserving
 * the error chain. This is useful when you need to augment or transform
 * an abort error without losing the original context.
 *
 * @param abortError - The original `AbortError` to copy.
 * @param override - An object with properties to override on the new error.
 *                   The following properties cannot be overridden:
 *                   - `cause` – always set to the original error.
 *                   - `timestamp` – always the creation time of the new error.
 *                   - `stack` – automatically generated.
 *                   - `name` – always `'AbortError'`.
 *                   All other properties of `AbortError` can be overridden.
 * @returns A new `AbortError` instance with the same properties as the original,
 *          except those specified in `override`.
 *
 * @example
 * const original = new AbortError('Operation aborted', { type: 'cancelled', initiator: 'user' });
 * const copy = copyAbortError(original, { message: 'Custom message', metadata: { retry: false } });
 * console.log(copy.message); // 'Custom message'
 * console.log(copy.type);    // 'cancelled' (from original)
 * console.log(copy.cause);   // original (the original error)
 */
export const copyAbortError = (
  abortError: AbortError,
  override: Omit<{ [key in keyof AbortError]?: AbortError[key] }, (typeof CANNOT_BE_OVERRIDDEN)[any]> = {}
) => {
  const foundOverriddenField = CANNOT_BE_OVERRIDDEN.find((key) => Object.prototype.hasOwnProperty.call(override, key));

  if (foundOverriddenField) {
    throw new TypeError(`The '${foundOverriddenField}' field cannot be overridden!`);
  }

  return new AbortError(override?.message ?? abortError.message, { ...abortError, ...override, cause: abortError });
};
