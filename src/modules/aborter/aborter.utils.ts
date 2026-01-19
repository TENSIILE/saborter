import { TimeoutError } from '../../features/timeout';
import { AbortError } from '../../features/abort-error';
import { Utils } from '../../shared';
import { ErrorMessage } from './aborter.constants';

export const getAbortErrorByReason = (reason?: any): AbortError | undefined => {
  if (reason === undefined) {
    return undefined;
  }

  if (reason instanceof AbortError) {
    return reason;
  }

  return new AbortError(Utils.get(reason, 'message') || ErrorMessage.AbortedSignalWithoutMessage, {
    reason
  });
};

export const hasThrowInTimeoutError = (error: any): boolean => {
  return error instanceof AbortError && error.cause instanceof TimeoutError && error.cause.hasThrow;
};
