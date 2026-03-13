import { TimeoutErrorOptions } from '../../features/timeout/timeout-error';
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

export const getTimeoutOptions = (timeout?: number | TimeoutErrorOptions) => {
  const timeoutMs = typeof timeout === 'number' ? timeout : timeout?.ms;
  const timeoutOptions =
    timeout === undefined ? undefined : { ms: timeoutMs!, ...(typeof timeout !== 'number' ? timeout : {}) };

  return { timeoutMs, timeoutOptions };
};

let removeAbortListener: VoidFunction = () => {};

export const createAbortablePromise = (
  signal: AbortSignal,
  { isErrorNativeBehavior }: { isErrorNativeBehavior: boolean }
): Promise<never> =>
  new Promise((_, reject) => {
    const handleAbort = () => {
      if (isErrorNativeBehavior && signal.reason instanceof AbortError && signal.reason.type === 'cancelled') {
        return;
      }
      reject(signal.reason);
    };
    signal.addEventListener('abort', handleAbort, { once: true });

    removeAbortListener = () => signal.removeEventListener('abort', handleAbort);
  });

createAbortablePromise.removeAbortListener = removeAbortListener;
