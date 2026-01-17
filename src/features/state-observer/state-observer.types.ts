export type RequestState = 'pending' | 'fulfilled' | 'rejected' | 'cancelled' | 'aborted';

export type OnStateChangeCallback = (state: RequestState) => void;

export interface StateListenerOptions {
  /**
   * Callback triggered on state change.
   */
  onStateChange?: OnStateChangeCallback;
}
