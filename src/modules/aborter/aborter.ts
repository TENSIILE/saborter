import { RequestState, emitRequestState } from '../../features/state-observer';
import { AbortError, isError, ABORT_ERROR_NAME } from '../../features/abort-error';
import { Timeout, TimeoutError } from '../../features/timeout';
import { ErrorMessage } from './aborter.constants';
import { EventListener, clearEventListeners } from '../../features/event-listener';
import * as Utils from './aborter.utils';
import * as Types from './aborter.types';

export class Aborter {
  protected abortController = new AbortController();

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
   * Returns true if Aborter has signaled to abort, and false otherwise.
   */
  public get isAborted(): boolean {
    return this.listeners.state.value === 'aborted';
  }

  /**
   * Returns the AbortSignal object associated with this object.
   * @deprecated
   */
  public get signal(): AbortSignal {
    return this.abortController?.signal;
  }

  private setRequestState = (state: RequestState): void => {
    emitRequestState(this.listeners.state, state);

    if ((['fulfilled', 'rejected', 'aborted'] as RequestState[]).indexOf(state) !== -1) {
      this.timeout.clearTimeout();
      this.isRequestInProgress = false;
    }
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
    if (this.isRequestInProgress) {
      const cancelledAbortError = new AbortError(ErrorMessage.CancelRequest, {
        type: 'cancelled',
        signal: this.signal,
        initiator: 'system'
      });

      this.setRequestState('cancelled');
      this.abort(cancelledAbortError);
    }

    let promise: Promise<R> | null = new Promise<R>((resolve, reject) => {
      this.abortController = new AbortController();
      this.isRequestInProgress = true;

      this.timeout.setTimeout(timeout?.ms, () => {
        const abortError = new AbortError(ErrorMessage.RequestTimedout, {
          initiator: 'timeout',
          cause: new TimeoutError(ErrorMessage.RequestTimedout, timeout)
        });
        this.abort(abortError);
      });

      queueMicrotask(() => this.setRequestState('pending'));

      request(this.abortController.signal)
        .then((response) => {
          if (!this.isRequestInProgress) return;

          this.setRequestState('fulfilled');
          resolve(response);
        })
        .catch((error: Error) => {
          if (error instanceof AbortError && error.type === 'aborted') {
            reject(error);
          }

          if (isErrorNativeBehavior || !Aborter.isError(error)) {
            this.setRequestState('rejected');

            reject(error);
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
    if (!this.isRequestInProgress) return;

    const error = Utils.getAbortErrorByReason(reason);

    this.listeners.dispatchEvent(error.type!, error);

    this.abortController.abort(error);

    this.setRequestState('aborted');
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

  /**
   * Clears the object's data completely: all subscriptions in all properties, clears overridden methods, state values.
   */
  public dispose = (): void => {
    this.timeout.clearTimeout();
    clearEventListeners(this.listeners);
  };
}
