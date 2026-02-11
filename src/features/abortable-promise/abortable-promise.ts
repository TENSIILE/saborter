type PromiseReject = (reason?: any) => void;
type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;
type PromiseExecutor<T> = (resolve: PromiseResolve<T>, reject: PromiseReject) => void;

/**
 * A Promise that can be aborted using an AbortSignal.
 *
 * If an AbortSignal is provided to the constructor and that signal is aborted
 * before the promise settles, the promise will reject with the signal's reason.
 *
 * @template T - The type of the value resolved by the promise.
 *
 * @param {PromiseExecutor<T>} executor - The executor function that defines the asynchronous operation.
 *        It receives the standard `resolve` and `reject` functions.
 * @param {AbortSignal} [signal] - Optional AbortSignal that can be used to cancel the promise.
 *        When the signal is aborted, the promise rejects with `signal.reason`.
 *
 * @example
 * // Basic usage with abort signal
 * const controller = new AbortController();
 * const promise = new AbortablePromise((resolve) => {
 *   const timeout = setTimeout(() => resolve('Done'), 1000);
 *   // The promise will reject automatically when controller.abort() is called
 * }, controller.signal);
 *
 * controller.abort('Cancelled');
 * promise.catch(err => console.log(err)); // 'Cancelled'
 *
 * @example
 * // Without abort signal – behaves like a normal Promise
 * const promise = new AbortablePromise((resolve) => {
 *   resolve('Success');
 * });
 * await promise; // 'Success'
 
  @private
 */
export class AbortablePromise<T> extends Promise<T> {
  constructor(executor: PromiseExecutor<T>, signal?: AbortSignal) {
    const abortableExecutor: PromiseExecutor<T> = (resolve, reject) => {
      if (signal?.aborted) {
        // the signal was interrupted before the promise was created
        reject(signal?.reason);
      }

      // Listen for abort event – if the signal is already aborted, this listener
      // will never be called because the event was already fired.
      signal?.addEventListener(
        'abort',
        () => {
          reject(signal?.reason);
        },
        { once: true }
      );

      executor(resolve, reject);
    };

    super(abortableExecutor);
  }
}
