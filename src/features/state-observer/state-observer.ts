import * as Types from './state-observer.types';

const EMIT_SYMBOL = Symbol('STATE-OBSERVER:MTD_EMIT');

export class StateObserver {
  /**
   * Current state value.
   */
  public value?: Types.RequestState;

  /**
   * Callback triggered on state change.
   */
  public onstatechange?: Types.OnStateChangeCallback;

  private subscribers = new Set<Types.OnStateChangeCallback>();

  /**
   * @internal
   */
  public static emit = (instance: StateObserver, state: Types.RequestState) => {
    instance[EMIT_SYMBOL](state);
  };

  constructor(options?: Types.StateListenerOptions) {
    this.onstatechange = options?.onStateChange;
  }

  /**
   * Subscribes a callback to state changes.
   * @param callbackfn - Callback function
   * @returns {VoidFunction} Unsubscribe function
   */
  public subscribe = (callbackfn: Types.OnStateChangeCallback): VoidFunction => {
    this.subscribers.add(callbackfn);

    return () => this.unsubscribe(callbackfn);
  };

  /**
   * Unsubscribes a callback from state changes.
   * @param callbackfn - Callback function to remove
   * @returns {void}
   */
  public unsubscribe = (callbackfn: Types.OnStateChangeCallback): void => {
    this.subscribers.delete(callbackfn);
  };

  /**
   * Sets new state and notifies all subscribers.
   * @param state - New state
   * @returns {void}
   */
  public [EMIT_SYMBOL] = (state: Types.RequestState): void => {
    this.value = state;

    this.subscribers.forEach((subscribe) => {
      subscribe(state);
    });
    this.onstatechange?.(state);
  };
}
