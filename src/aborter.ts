import * as Utils from './utils';
import * as Constants from './constants';
import * as Types from './types';

export class Aborter {
  protected abortController = new AbortController();

  /**
   * The name of the error instance thrown by the AbortSignal.
   * @readonly
   */
  public static readonly errorName = Constants.ABORT_ERROR_NAME;

  /**
   * Method of checking whether an error is an error AbortError.
   * @returns boolean
   */
  public static isError = Utils.isError;

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
      this.abort();

      this.abortController = new AbortController();

      const { signal } = this.abortController;

      request(signal)
        .then(resolve)
        .catch((err: Error) => {
          const error: Error = {
            ...err,
            message: err?.message || Utils.get(err, Constants.ERROR_CAUSE_PATH_MESSAGE) || ''
          };

          if (isErrorNativeBehavior || !Aborter.isError(err)) {
            return reject(error);
          }

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
    this.abortController = new AbortController();
  };
}
