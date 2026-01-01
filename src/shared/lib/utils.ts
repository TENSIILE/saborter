import * as Constants from '../constants';
import { AbortError } from './abort-error';

export const get = <T, R>(object: T, path: string) =>
  path.split('.').reduce((acc, key) => acc && (acc as Record<string, any>)[key], object) as unknown as R;

const checkErrorCause = (error: unknown) =>
  get(error, Constants.ERROR_CAUSE_PATH_NAME) === Constants.ABORT_ERROR_NAME ||
  Constants.ABORT_ERROR_MESSAGES.includes(get(error, Constants.ERROR_CAUSE_PATH_MESSAGE));

export const isError = (error: unknown): error is Error =>
  error instanceof AbortError ||
  Constants.ABORT_ERROR_MESSAGES.includes((error as Error | undefined)?.message ?? '') ||
  checkErrorCause(error);
