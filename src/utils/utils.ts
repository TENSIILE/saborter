import * as Constants from '../constants';

export const get = <T, R>(object: T, path: string) =>
  path.split('.').reduce((acc, key) => acc && (acc as Record<string, any>)[key], object) as unknown as R;

export const isError = (error: unknown): error is Error =>
  Constants.ABORT_ERROR_MESSAGES.includes((error as Error | undefined)?.message ?? '') ||
  get(error, Constants.ERROR_CAUSE_PATH_NAME) === Constants.ABORT_ERROR_NAME ||
  Constants.ABORT_ERROR_MESSAGES.includes(get(error, Constants.ERROR_CAUSE_PATH_MESSAGE));
