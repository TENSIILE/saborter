import { AbortError } from '../../features/abort-error';
import { ErrorMessage } from './aborter.constants';

export const getAbortErrorByReason = (reason?: any): AbortError => {
  if (reason instanceof AbortError) {
    return reason;
  }

  return new AbortError(ErrorMessage.AbortedSignalWithoutMessage, {
    reason,
    type: 'aborted',
    initiator: 'user'
  });
};
