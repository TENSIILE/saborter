import { AbortError } from '../../abort-error';
import { ABORT_ERROR_NAME } from '../../abort-error/abort-error.constants';

type AbortSignalLike = AbortSignal | null | undefined;

const createAbortError = (signal: AbortSignal) => {
  const isReasonDOMException = signal.reason instanceof DOMException && signal.reason.name === ABORT_ERROR_NAME;

  const reasonKey = isReasonDOMException ? 'cause' : 'reason';

  return signal.reason instanceof AbortError
    ? signal.reason
    : new AbortError('The operation was aborted', { [reasonKey]: signal.reason, initiator: 'abortSignalAny' });
};

/**
 * Combines multiple abort signals into a single signal that aborts when any of the input signals aborts.
 * If any of the provided signals is already aborted when the function is called, the resulting signal
 * will be immediately aborted.
 *
 * @template T - The type of the arguments (allows mixing of single signals and arrays).
 * @param {...(T | T[])} args - A list of abort signals (or arrays of signals) to combine.
 * @returns {AbortSignal} A new AbortSignal that will be aborted when any of the input signals aborts.
 *
 * @example
 * // Combine two signals
 * const ctrl1 = new AbortController();
 * const ctrl2 = new AbortController();
 * const combined = abortSignalAny(ctrl1.signal, ctrl2.signal);
 * combined.addEventListener('abort', () => console.log('Aborted!'));
 * ctrl1.abort(); // triggers combined abort
 *
 * @example
 * // Using arrays
 * const signals = [ctrl1.signal, ctrl2.signal];
 * const combined = abortSignalAny(signals);
 *
 * @example
 * // Signal transmission in the rest of the format
 * const combined = abortSignalAny(ctrl1.signal, ctrl2.signal, ctrl3.signal);
 */
export const abortSignalAny = <T extends AbortSignalLike | AbortSignalLike[]>(...args: T[]): AbortSignal => {
  const signals = args.flat();

  const controller = new AbortController();

  signals.forEach((signal) => {
    if (signal?.aborted) {
      controller.abort(createAbortError(signal));
    }

    const handler = () => {
      if (signal) {
        controller.abort(createAbortError(signal));
      }

      signals.forEach((sign) => {
        sign?.removeEventListener('abort', handler);
      });
    };

    signal?.addEventListener('abort', handler, { once: true });
  });

  return controller.signal;
};
