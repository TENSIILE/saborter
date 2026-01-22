import { AbortError } from '../../features/abort-error';
import { Utils } from '../../shared';
import { ErrorMessage } from './aborter.constants';

export const getAbortErrorByReason = (reason?: any): AbortError => {
  if (reason instanceof AbortError) {
    return reason;
  }

  return new AbortError(Utils.get(reason, 'message') || ErrorMessage.AbortedSignalWithoutMessage, {
    reason,
    type: 'aborted',
    initiator: 'user'
  });
};
