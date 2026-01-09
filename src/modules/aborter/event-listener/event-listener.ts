import * as Types from './event-listener.types';

export class EventListener {
  private abortListeners = new Set<(event: Types.EventMap['abort']) => any>();

  /**
   * Method called when an Aborter request is cancelled
   */
  public onabort?: Types.OnAbortCallback;

  constructor(options: Types.EventListenerOptions) {
    this.onabort = options.onabort;
  }

  private getListenersByType = <K extends Types.EventListenerType>(type: K): Set<(event: Types.EventMap[K]) => any> => {
    const listeners: Record<Types.EventListenerType, Set<(event: Types.EventMap[K]) => any>> = {
      abort: this.abortListeners
    };

    return listeners[type];
  };

  /**
   * Appends an event listener for events whose type attribute value is type. The callback argument sets the callback that will be invoked when the event is dispatched.
   */
  public addEventListener = <K extends Types.EventListenerType>(
    type: K,
    listener: (event: Types.EventMap[K]) => any
  ): void => {
    this.getListenersByType(type).add(listener);
  };

  /**
   * Removes the event listener in target's event listener list with the same type, callback, and options.
   */
  public removeEventListener = <K extends Types.EventListenerType>(
    type: K,
    listener: (event: Types.EventMap[K]) => any
  ): void => {
    this.getListenersByType(type).delete(listener);
  };

  protected emitEvent = <K extends Types.EventListenerType>(type: K, event: Types.EventMap[K]): void => {
    if (type === 'abort') {
      this.onabort?.(event);
    }
    this.getListenersByType(type).forEach(listener => listener(event));
  };
}
