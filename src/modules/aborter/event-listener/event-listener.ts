import * as Types from './event-listener.types';

export class EventListener {
  private listeners: Record<Types.EventListenerType, Set<Types.EventCallback<any>>> = {
    aborted: new Set<Types.EventCallback<'aborted'>>(),
    cancelled: new Set<Types.EventCallback<'cancelled'>>()
  };

  /**
   * Method called when an Aborter request is cancelled
   */
  public onabort?: Types.OnAbortCallback;

  constructor(options?: Types.EventListenerOptions) {
    this.onabort = options?.onabort;
  }

  private getListenersByType = <T extends Types.EventListenerType>(type: T): Set<Types.EventCallback<T>> => {
    return this.listeners[type] as Set<Types.EventCallback<T>>;
  };

  /**
   * Appends an event listener for events whose type attribute value is type. The callback argument sets the callback that will be invoked when the event is dispatched.
   */
  public addEventListener = <T extends Types.EventListenerType, L extends Types.EventCallback<T>>(
    type: T,
    listener: L
  ): (() => void) => {
    this.getListenersByType(type).add(listener);

    return () => this.removeEventListener(type, listener);
  };

  /**
   * Removes the event listener in target's event listener list with the same type, callback, and options.
   */
  public removeEventListener = <T extends Types.EventListenerType, L extends Types.EventCallback<T>>(
    type: T,
    listener: L
  ): void => {
    this.getListenersByType(type).delete(listener);
  };

  public dispatchEvent = <T extends Types.EventListenerType, E extends Types.EventMap[T]>(type: T, event: E): void => {
    if (type === 'aborted' || type === 'cancelled') {
      this.onabort?.(event);
    }
    this.getListenersByType(type).forEach(listener => listener(event));
  };
}
