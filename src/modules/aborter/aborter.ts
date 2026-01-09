import { AbortError, getCauseMessage, isError, ABORT_ERROR_NAME } from '../../features/abort-error';
import { EventListener } from './event-listener';
import * as Types from './aborter.types';

export class Aborter extends EventListener {
  protected abortController = new AbortController();

  constructor(options?: Types.AborterOptions) {
    super({ onabort: options?.onabort });
  }

  /**
   * The name of the error instance thrown by the AbortSignal.
   * @readonly
   */
  public static readonly errorName = ABORT_ERROR_NAME;

  /**
   * Method of checking whether an error is an error AbortError.
   * @returns boolean
   */
  public static isError = isError;

  /**
   * Returns the AbortSignal object associated with this object.
   */
  public get signal(): AbortSignal {
    return this.abortController.signal;
  }

  /**
   * Performs an asynchronous request with cancellation of the previous request, preventing the call of the catch block when the request is canceled and the subsequent finally block.
   * @param request callback function
   * @param options an object that receives a set of settings for performing a request attempt
   * @returns Promise
   */
  public try = <R>(
    request: Types.AbortRequest<R>,
    { isErrorNativeBehavior = false }: Types.FnTryOptions = {}
  ): Promise<R> => {
    let promise: Promise<R> | null = new Promise<R>((resolve, reject) => {
      this.abort(new AbortError('cancellation of the previous AbortController', { isCancelled: true }));

      this.abortController = new AbortController();

      const { signal } = this.abortController;

      request(signal)
        .then(resolve)
        .catch((err: Error) => {
          const error: Error = {
            ...err,
            message: err?.message || getCauseMessage(err) || ''
          };

          if (isErrorNativeBehavior || !Aborter.isError(err)) {
            return reject(error);
          }

          const abortError = new AbortError(error.message);

          this.emitEvent('abort', abortError);

          promise = null;
        });
    });

    return promise;
  };

  /**
   * Calling this method sets the AbortSignal flag of this object and signals all observers that the associated action should be aborted.
   */
  public abort = (reason?: any) => {
    this.abortController.abort(reason);
  };

  /**
   * Calling this method sets the AbortSignal flag of this object and signals all observers that the associated action should be aborted.
   * After aborting, it restores the AbortSignal, resetting the isAborted property, and interaction with the signal property becomes available again.
   */
  public abortWithRecovery = (reason?: any) => {
    this.abort(reason);
    this.abortController = new AbortController();
  };
}
