import { AbortError } from '../../abort-error';
import { copyAbortError } from '../../abort-error/abort-error.lib';
import { logger } from '../../../shared/logger';

/**
 * Executes a handler function or evaluates a code string with a timeout,
 * supporting abort signal for cancellation.
 *
 * @template T The return type of the handler function.
 * @param {((signal: AbortSignal) => T | Promise<T>)} handler -
 *        A function that accepts an AbortSignal and returns a value or Promise.
 *        This function will be called with an AbortSignal to ensure cleanup upon interruption.
 * @param {number} [delay] - Optional timeout in milliseconds. If not provided,
 *        the handler will be scheduled without a delay.
 * @param {Object} [options] - Configuration options.
 * @param {AbortSignal} [options.signal] - AbortSignal to cancel the timeout.
 *        If not provided, a new AbortController will be created internally.
 * @param {any[]} [options.args] - Arguments to pass to the handler.
 * @returns {Promise<T>} A promise that resolves with the handler's result or rejects
 *         with an AbortError if the operation is aborted, or with any error thrown by the handler.
 *
 * @example
 * const controller = new AbortController();
 *
 * try {
 *   const data = await setTimeoutAsync(
 *     (signal) => fetch('/api/data', { signal }).then(res => res.json()),
 *     5000,
 *     { signal: controller.signal }
 *   )
 * } catch (error) {
 *   console.log(error.name) // 'AbortError' Saborter's Error
 * }
 */
export const setTimeoutAsync = <T, A extends [unknown?, ...unknown[]] = []>(
  handler: (signal: AbortSignal, args: A extends [] ? undefined : A) => T | Promise<T>,
  delay?: number,
  options?: {
    signal?: AbortSignal;
    args?: A;
  }
): Promise<T> => {
  const { args, signal = new AbortController().signal } = options ?? {};

  return new Promise<T>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | undefined;

    if (signal.aborted) {
      if (!signal.reason?.message) {
        logger.warn(`${setTimeoutAsync.name} -> no message indicating the reason for the signal interruption`, signal);
      }
      reject(
        new AbortError(signal.reason?.message || 'The signal was interrupted before the timeout was initialized', {
          initiator: setTimeoutAsync.name,
          reason: signal.reason
        })
      );
    }

    const handleEventListener = () => {
      clearTimeout(timeoutId);

      if (signal.reason instanceof AbortError) {
        return reject(copyAbortError(signal.reason, { initiator: setTimeoutAsync.name }));
      }

      const error = new AbortError(`${setTimeoutAsync.name} was interrupted`, {
        initiator: setTimeoutAsync.name,
        reason: signal.reason
      });

      reject(error);
    };

    timeoutId = setTimeout(() => {
      try {
        const promise = handler(signal, args as A extends [] ? undefined : A);

        if (promise instanceof Promise) {
          return promise.then(resolve).catch(reject);
        }

        return resolve(promise);
      } catch (error) {
        reject(error);
      } finally {
        signal?.removeEventListener('abort', handleEventListener);
      }
    }, delay);

    signal?.addEventListener('abort', handleEventListener, { once: true });
  });
};
