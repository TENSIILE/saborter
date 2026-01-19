import * as Types from './event-listener.types';
import { StateObserver, clearStateListeners } from '../state-observer';
import { CLEAR_METHOD_SYMBOL } from './event-listener.constants';

export class EventListener {
  private listeners = {} as Record<Types.EventListenerType, Set<Types.EventCallback<any>>>;

  /**
   * Method called when an Aborter request is cancelled
   */
  public onabort?: Types.OnAbortCallback;

  /**
   * Returns an `StateObserver` object for monitoring the status of requests.
   */
  public state = new StateObserver();

  constructor(options?: Types.EventListenerOptions) {
    this.onabort = options?.onAbort;
    this.state.onstatechange = options?.onStateChange;
  }

  private getListenersByType = <T extends Types.EventListenerType>(type: T): Set<Types.EventCallback<T>> => {
    this.listeners[type] ??= new Set();

    return this.listeners[type] as Set<Types.EventCallback<T>>;
  };

  /**
   * Appends an event listener for events whose type attribute value is type. The callback argument sets the callback that will be invoked when the event is dispatched.
   */
  public addEventListener = <T extends Types.EventListenerType, L extends Types.EventCallback<T>>(
    type: T,
    listener: L
  ): VoidFunction => {
    this.getListenersByType(type).add(listener);

    return () => this.removeEventListener(type, listener);
  };

  /**
   * Removes the event listener in target's event listener list with the same type and callback.
   */
  public removeEventListener = <T extends Types.EventListenerType, L extends Types.EventCallback<T>>(
    type: T,
    listener: L
  ): void => {
    this.getListenersByType(type).delete(listener);
  };

  /**
   * Dispatches a synthetic event event to target
   */
  public dispatchEvent = <T extends Types.EventListenerType, E extends Types.EventMap[T]>(type: T, event: E): void => {
    if (type === 'aborted' || type === 'cancelled') {
      this.onabort?.(event);
    }
    this.getListenersByType(type).forEach((listener) => listener(event));
  };

  /**
   * Clears the object's data completely.
   * @internal
   */
  public [CLEAR_METHOD_SYMBOL] = (): void => {
    this.listeners = {} as Record<Types.EventListenerType, Set<Types.EventCallback<any>>>;
    this.onabort = undefined;
    clearStateListeners(this.state);
  };
}
