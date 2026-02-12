/* eslint-disable no-param-reassign */
import * as Types from './reusable-aborter.types';

export class ReusableAborter {
  protected abortController = new AbortController();

  protected originalSignalApi = {} as Types.OriginalSignalApi;

  protected originalSignalListenerParams: Types.OriginalSignalListenerParams[] = [];

  constructor() {
    const abortController = new AbortController();

    this.saveSignalListenersApi(abortController.signal);

    this.assignSignalListeners(abortController.signal);

    this.abortController = abortController;
  }

  protected assignSignalListeners = (targetSignal: AbortSignal): void => {
    const that = this;

    targetSignal.addEventListener = function <K extends keyof AbortSignalEventMap>(
      type: K,
      listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ) {
      if (options === undefined || (typeof options === 'object' && !options?.once)) {
        that.originalSignalListenerParams.push({ type, listener, options });
      }

      that.originalSignalApi.addEventListener.call(this, type, listener, options);
    };

    targetSignal.removeEventListener = function <K extends keyof AbortSignalEventMap>(
      type: K,
      listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any,
      options?: boolean | EventListenerOptions
    ) {
      that.originalSignalListenerParams.filter((arg) => arg.type !== type && arg.listener !== listener);
      that.originalSignalApi.removeEventListener.call(this, type, listener, options);
    };
  };

  protected saveSignalListenersApi = (originalSignal: AbortSignal): void => {
    this.originalSignalApi.addEventListener = originalSignal.addEventListener;
    this.originalSignalApi.removeEventListener = originalSignal.removeEventListener;
  };

  protected recoverySignalListeners = (originalSignal: AbortSignal, targetSignal: AbortSignal): void => {
    targetSignal.onabort = originalSignal.onabort;
    this.originalSignalListenerParams.forEach(({ type, listener, options }) => {
      targetSignal.addEventListener(type, listener, options);
    });

    this.assignSignalListeners(targetSignal);
  };

  public get signal(): AbortSignal {
    return this.abortController.signal;
  }

  public abort = (reason?: any): void => {
    this.abortController.abort(reason);

    const abortController = new AbortController();

    this.recoverySignalListeners(this.abortController.signal, abortController.signal);

    this.abortController = abortController;
  };
}
