import { ABORT_ERROR_NAME, ERROR_CAUSE_PATH_MESSAGE, ERROR_CAUSE_PATH_NAME } from './abort-error.constants';
import { AbortError } from './abort-error';
import { Utils } from '../../shared';

const checkErrorCause = (error: unknown) =>
  Utils.get(error, ERROR_CAUSE_PATH_NAME) === ABORT_ERROR_NAME ||
  'abort'.includes(Utils.get(error, ERROR_CAUSE_PATH_MESSAGE));

/**
 * Function of checking whether an error is an error AbortError.
 * @returns boolean
 */
export const isAbortError = (error: any): error is Error => {
  if (error instanceof AbortError) {
    return true;
  }

  if (Utils.isObject(error) && 'name' in error && error.name === ABORT_ERROR_NAME) {
    return true;
  }

  if ((error as Error | undefined)?.message && 'abort'.includes(error.message)) {
    return true;
  }

  return checkErrorCause(error);
};
