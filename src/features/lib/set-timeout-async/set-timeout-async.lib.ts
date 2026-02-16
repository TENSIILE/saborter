import { AbortError } from '../../abort-error';
import { logger } from '../../../shared/logger';

/**
 * Executes a handler function or evaluates a code string with a timeout,
 * supporting abort signal for cancellation.
 *
 * @template T The return type of the handler function.
 * @param {string | ((signal: AbortSignal) => T | Promise<T>)} handler -
 *        Either a string of code to evaluate or a function that takes an AbortSignal
 *        and returns a value or Promise. If it's a function, it will be called with
 *        the AbortSignal to allow cleanup on abort.
 * @param {number} [timeout] - Optional timeout in milliseconds. If not provided,
 *        the handler will be scheduled without a delay.
 * @param {Object} [options] - Configuration options.
 * @param {AbortSignal} [options.signal] - AbortSignal to cancel the timeout.
 *        If not provided, a new AbortController will be created internally.
 * @param {any[]} [options.args] - Arguments to pass to the handler if it's a string.
 *        These arguments will be passed as parameters to the code string when evaluated.
 * @returns {Promise<T>} A promise that resolves with the handler's result or rejects
 *         with an AbortError if the operation is aborted, or with any error thrown by the handler.
 *
 * @example
 * const controller = new AbortController();
 *
 * try {
 *   const data = await setTimeoutAsync(
 *     (signal) => fetch('/api/data', { signal }),
 *     5000,
 *     { signal: controller.signal }
 *   )
 * } catch (error) {
 *   console.log(error.name) // 'AbortError' Saborter's Error
 * }
 */
export const setTimeoutAsync = <T>(
  handler: string | ((signal: AbortSignal) => T | Promise<T>),
  timeout?: number,
  options?: {
    signal?: AbortSignal;
    args?: any[];
  }
): Promise<T> => {
  const { args = [], signal = new AbortController().signal } = options ?? {};

  return new Promise<T>((resolve, reject) => {
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

    const timeoutId = setTimeout(
      typeof handler === 'string'
        ? handler
        : () => {
            try {
              const promise = handler(signal);

              if (promise instanceof Promise) {
                return promise.then(resolve).catch(reject);
              }

              return resolve(promise);
            } catch (error) {
              reject(error);
            }
          },
      timeout,
      ...args
    );

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeoutId);

        if (signal.reason instanceof AbortError) {
          signal.reason.cause = new AbortError(signal.reason.message, { ...signal.reason });
          signal.reason.initiator = setTimeoutAsync.name;

          return reject(signal.reason);
        }

        const error = new AbortError(`${setTimeoutAsync.name} was interrupted`, {
          initiator: setTimeoutAsync.name,
          reason: signal.reason
        });

        reject(error);
      },
      { once: true }
    );
  });
};
