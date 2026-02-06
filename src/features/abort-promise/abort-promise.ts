type PromiseReject = (reason?: any) => void;
type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;
type PromiseExecutor<T> = (resolve: PromiseResolve<T>, reject: PromiseReject) => void;

export class AbortPromise<T> extends Promise<T> {
  constructor(executor: PromiseExecutor<T>, signal?: AbortSignal) {
    const abortableExecutor: PromiseExecutor<T> = (resolve, reject) => {
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
