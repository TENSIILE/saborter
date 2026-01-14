import { AbortError, getCauseMessage, isError } from '../../features/abort-error';
import { Timeout, TimeoutError } from '../../features/timeout';
import { EventListener } from './event-listener';
import { Utils } from '../../shared';
import * as Types from './aborter.types';

export class Aborter {
  protected pendingRequests: Map<
    string,
    {
      controller: AbortController;
      timeout: Timeout;
    }
  > = new Map();

  /**
   * Returns an `EventListener` instance to listen for `Aborter` events.
   */
  public listeners: EventListener;

  constructor(options?: Types.AborterOptions) {
    this.listeners = new EventListener({ onAbort: options?.onAbort });
  }

  /**
   * Method of checking whether an error is an error AbortError.
   * @returns boolean
   */
  public static isError = isError;

  /**
   * Performs an asynchronous request with cancellation of the previous request, preventing the call of the catch block when the request is canceled and the subsequent finally block.
   * @param request callback function
   * @param options an object that receives a set of settings for performing a request attempt
   * @returns Promise
   */
  public try = <R>(
    request: Types.AbortRequest<R>,
    { isErrorNativeBehavior = false, timeout, name = 'unknown' }: Types.TryMethodOptions = {}
  ): Promise<R> => {
    const requestName = request.name || name;

    const cancelledAbortError = new AbortError('cancellation of the previous AbortController', {
      type: 'cancelled'
    });

    this.listeners.dispatchEvent('cancelled', cancelledAbortError);
    this.abortByRequestName(requestName, { reason: cancelledAbortError });

    const abortController = new AbortController();
    const timeoutInstance = new Timeout();

    timeoutInstance.setTimeout(timeout?.ms, () => {
      this.abortByRequestName(requestName, {
        reason: new TimeoutError('the request timed out and an automatic abort occurred', timeout)
      });
    });

    this.pendingRequests.set(requestName, {
      controller: abortController,
      timeout: timeoutInstance
    });

    let promise: Promise<R> | null = new Promise<R>((resolve, reject) => {
      const callReject = (error: Error) => {
        this.pendingRequests.delete(requestName);

        return reject(error);
      };

      request(abortController.signal)
        .then((response) => {
          this.pendingRequests.delete(requestName);
          resolve(response);
        })
        .catch((err: Error) => {
          const errorMessage = err?.message || getCauseMessage(err) || '';

          const error: Error = {
            ...err,
            message: errorMessage
          };

          if (err instanceof TimeoutError && err.hasThrow) {
            callReject(new TimeoutError(errorMessage, timeout));
          }

          if (isErrorNativeBehavior || (!Aborter.isError(err) && !((err as any) instanceof TimeoutError))) {
            callReject(err);
          }

          if ((error as AbortError)?.type !== 'cancelled') {
            this.listeners.dispatchEvent(
              'aborted',
              new AbortError(error.message, {
                reason: Utils.get(error, 'reason')
              })
            );
          }

          promise = null;
        });
    });

    return promise;
  };

  /**
   * Cancels a specific request by request name.
   */
  protected abortByRequestName = (requestName: string, options?: Types.AbortByRequestNameMethodOptions): void => {
    const request = this.pendingRequests.get(requestName);

    if (request) {
      request.timeout.clearTimeout();
      request.controller.abort(options?.reason);
      this.pendingRequests.delete(requestName);
    }
  };

  /**
   * Calling this method sets the AbortSignal flag of this object and signals all observers that the associated action should be aborted.
   */
  public abort = (options?: Types.AbortMethodOptions): void => {
    if (options?.abortByName) {
      if (Array.isArray(options.abortByName)) {
        return options.abortByName.forEach((name) => {
          this.abortByRequestName(name, { reason: options.reason });
        });
      }
      return this.abortByRequestName(options.abortByName, { reason: options.reason });
    }

    this.pendingRequests.forEach((request) => {
      request.timeout.clearTimeout();
      request.controller.abort(options?.reason);
    });
    this.pendingRequests.clear();
  };
}
