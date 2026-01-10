import {
  ABORT_ERROR_MESSAGES,
  ABORT_ERROR_NAME,
  ERROR_CAUSE_PATH_MESSAGE,
  ERROR_CAUSE_PATH_NAME
} from './abort-error.constants';
import { AbortError } from './abort-error';
import { Utils } from '../../shared';

const checkErrorCause = (error: unknown) =>
  Utils.get(error, ERROR_CAUSE_PATH_NAME) === ABORT_ERROR_NAME ||
  ABORT_ERROR_MESSAGES.includes(Utils.get(error, ERROR_CAUSE_PATH_MESSAGE));

export const isError = (error: any): error is Error =>
  error instanceof AbortError ||
  ('name' in error && error.name === ABORT_ERROR_NAME) ||
  ABORT_ERROR_MESSAGES.includes((error as Error | undefined)?.message ?? '') ||
  checkErrorCause(error);

export const getCauseMessage = (error: unknown) => {
  return Utils.get<unknown, string>(error, ERROR_CAUSE_PATH_MESSAGE);
};
