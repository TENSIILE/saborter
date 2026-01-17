import { AbortError, getCauseMessage, isError, ABORT_ERROR_NAME } from '../../features/abort-error';
import { Timeout, TimeoutError } from '../../features/timeout';
import { EventListener } from '../../features/event-listener';
import { StateObserver, RequestState } from '../../features/state-observer';
import { Utils } from '../../shared';
import * as Types from './aborter.types';

export class Aborter {
  protected abortController: AbortController | null = null;

  protected isRequestInProgress = false;

  protected timeout = new Timeout();

  /**
   * Returns an `EventListener` instance to listen for `Aborter` events.
   */
  public listeners: EventListener;

  constructor(options?: Types.AborterOptions) {
    this.listeners = new EventListener(options);
  }

  /**
   * The name of the error instance thrown by the AbortSignal.
   * @readonly
   * @deprecated use AbortError.name
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
  public get signal(): AbortSignal | undefined {
    return this.abortController?.signal;
  }

  private setRequestState = (state: RequestState): void => {
    StateObserver.emit(this.listeners.state, state);
  };

  /**
   * Performs an asynchronous request with cancellation of the previous request, preventing the call of the catch block when the request is canceled and the subsequent finally block.
   * @param request callback function
   * @param options an object that receives a set of settings for performing a request attempt
   * @returns Promise
   */
  public try = <R>(
    request: Types.AbortRequest<R>,
    { isErrorNativeBehavior = false, timeout }: Types.FnTryOptions = {}
  ): Promise<R> => {
    if (this.isRequestInProgress && this.abortController) {
      const cancelledAbortError = new AbortError('cancellation of the previous AbortController', {
        type: 'cancelled',
        signal: this.signal
      });

      this.setRequestState('cancelled');
      this.listeners.dispatchEvent('cancelled', cancelledAbortError);
      this.abort(cancelledAbortError);
    }

    let promise: Promise<R> | null = new Promise<R>((resolve, reject) => {
      this.abortController = new AbortController();
      this.isRequestInProgress = true;

      this.timeout.setTimeout(timeout?.ms, () => {
        this.abort(new TimeoutError('the request timed out and an automatic abort occurred', timeout));
      });

      queueMicrotask(() => this.setRequestState('pending'));

      request(this.abortController.signal)
        .then((response) => {
          if (!this.isRequestInProgress) return;

          this.isRequestInProgress = false;
          this.setRequestState('fulfilled');
          resolve(response);
        })
        .catch((err: Error) => {
          const error: Error = {
            ...err,
            message: err?.message || getCauseMessage(err) || ''
          };

          if (isErrorNativeBehavior || !Aborter.isError(err) || (err instanceof TimeoutError && err.hasThrow)) {
            this.isRequestInProgress = false;
            this.setRequestState('rejected');

            return reject(error);
          }

          if ((error as AbortError)?.type !== 'cancelled') {
            this.isRequestInProgress = false;
            this.setRequestState('aborted');
            this.listeners.dispatchEvent(
              'aborted',
              new AbortError(error.message, {
                signal: this.signal,
                reason: Utils.get(error, 'reason') || this.signal?.reason
              })
            );
          }

          promise = null;
        });
    });

    return promise;
  };

  /**
   * Calling this method sets the AbortSignal flag of this object and signals all observers that the associated action should be aborted.
   */
  public abort = (reason?: any): void => {
    if (this.abortController) {
      this.abortController.abort(reason);
      this.abortController = null;
      this.isRequestInProgress = false;
      this.timeout.clearTimeout();
    }
  };

  /**
   * Calling this method sets the AbortSignal flag of this object and signals all observers that the associated action should be aborted.
   * After aborting, it restores the AbortSignal, resetting the isAborted property, and interaction with the signal property becomes available again.
   */
  public abortWithRecovery = (reason?: any): AbortController => {
    this.abort(reason);
    this.abortController = new AbortController();

    return this.abortController;
  };
}
