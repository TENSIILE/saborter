import * as Types from './event-listener.types';
import { StateObserver, clearStateListeners } from '../state-observer';
import { CLEAR_METHOD_SYMBOL } from './event-listener.constants';

export class EventListener {
  private listeners = {} as Record<Types.EventListenerType, Set<Types.ListenerWrapper<any>>>;

  /**
   * Method called when an Aborter request is cancelled
   */
  public onabort?: Types.OnAbortCallback;

  /**
   * Returns an `StateObserver` object for monitoring the status of requests.
   */
  public state = new StateObserver();

  constructor(options?: Types.EventListenerConstructorOptions) {
    this.onabort = options?.onAbort;
    this.state.onstatechange = options?.onStateChange;
  }

  private getListenersByType = <T extends Types.EventListenerType>(type: T): Set<Types.ListenerWrapper<T>> => {
    this.listeners[type] ??= new Set();

    return this.listeners[type] as Set<Types.ListenerWrapper<T>>;
  };

  /**
   * Appends an event listener for events whose type attribute value is type. The callback argument sets the callback that will be invoked when the event is dispatched.
   */
  public addEventListener = <T extends Types.EventListenerType>(
    type: T,
    listener: Types.EventCallback<T>,
    options?: Types.EventListenerOptions
  ): VoidFunction => {
    const wrapper: Types.ListenerWrapper<T> = {
      originalListener: listener
    };

    if (options?.once) {
      const onceWrapper = (event: Types.EventMap[T]) => {
        listener(event);
        this.getListenersByType(type).delete(wrapper);
      };
      wrapper.wrappedListener = onceWrapper;
    }

    this.getListenersByType(type).add(wrapper);

    return () => this.removeEventListener(type, listener);
  };

  /**
   * Removes the event listener in target's event listener list with the same type and callback.
   */
  public removeEventListener = <T extends Types.EventListenerType>(type: T, listener: Types.EventCallback<T>): void => {
    const listeners = this.getListenersByType(type);

    // eslint-disable-next-line no-restricted-syntax
    for (const wrapper of listeners) {
      if (wrapper.originalListener === listener) {
        this.getListenersByType(type).delete(wrapper);
        break;
      }
    }
  };

  /**
   * Dispatches a synthetic event event to target
   */
  public dispatchEvent = <T extends Types.EventListenerType>(type: T, event: Types.EventMap[T]): void => {
    if (type === 'aborted' || type === 'cancelled') {
      this.onabort?.(event);
    }

    const listeners = [...this.getListenersByType(type)];

    listeners.forEach((wrapper) => {
      const listener = wrapper.wrappedListener || wrapper.originalListener;

      listener(event);
    });
  };

  /**
   * Clears the object's data completely.
   * @internal
   */
  public [CLEAR_METHOD_SYMBOL] = (): void => {
    this.listeners = {} as Record<Types.EventListenerType, Set<Types.ListenerWrapper<any>>>;
    this.onabort = undefined;
    clearStateListeners(this.state);
  };
}
