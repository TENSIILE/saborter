import { RequestState, emitRequestState } from '../../features/state-observer';
import { AbortError, isAbortError } from '../../features/abort-error';
import { EventListener, clearEventListeners } from '../../features/event-listener';
import { AbortablePromise } from '../../features/abortable-promise';
import { Timeout, TimeoutError } from '../../features/timeout';
import { ErrorMessage, disposeSymbol } from './aborter.constants';
import * as Utils from './aborter.utils';
import * as Types from './aborter.types';
import { logger } from '../../shared';

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
   * Returns true if Aborter has signaled to abort, and false otherwise.
   */
  public get isAborted(): boolean {
    return this.signal.aborted && this.listeners.state.value === 'aborted';
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
        initiator: 'system'
      });

      this.abort(cancelledAbortError);
      logger.info('The request was cancelled -> ', cancelledAbortError);
    }

    this.abortController = new AbortController();

    let promise: Promise<R> | null = new AbortablePromise<R>((resolve, reject) => {
      this.isRequestInProgress = true;

      this.timeout.setTimeout(timeout?.ms, () => {
        const abortError = new AbortError(ErrorMessage.RequestTimedout, {
          initiator: 'timeout',
          cause: new TimeoutError(ErrorMessage.RequestTimedout, timeout)
        });

        this.abort(abortError);
        logger.info('The request was cancelled due to a timeout -> ', abortError);
      });

      queueMicrotask(() => this.setRequestState('pending'));

      request(this.abortController.signal)
        .then((response) => {
          if (!this.isRequestInProgress)
            return logger.info('While the request is being executed, the request will not be resolved');

          this.setRequestState('fulfilled');

          resolve(response);
        })
        .catch((error: Error) => {
          if (error instanceof AbortError && error.type === 'aborted') {
            reject(error);
          }

          if (isErrorNativeBehavior || !isAbortError(error)) {
            this.setRequestState('rejected');

            reject(error);
          }

          promise = null;
        });
    }, this.abortController.signal);

    return promise;
  };

  /**
   * Calling this method sets the AbortSignal flag of this object and signals all observers that the associated action should be aborted.
   */
  public abort = (reason?: any): void => {
    if (!this.isRequestInProgress) return logger.info('Until a request is executed, it cannot be interrupted');

    const error = Utils.getAbortErrorByReason(reason);

    this.listeners.dispatchEvent(error.type!, error);

    this.abortController.abort(error);

    this.setRequestState(error.type!);
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
  public [disposeSymbol] = (): void => {
    this.timeout.clearTimeout();
    clearEventListeners(this.listeners);
    logger.info('Resources have been released');
  };
}
