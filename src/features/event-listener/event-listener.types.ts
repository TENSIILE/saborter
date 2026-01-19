import { AbortError } from '../abort-error';
import { OnStateChangeCallback } from '../state-observer';

export interface EventMap {
  aborted: AbortError;
  cancelled: AbortError;
  timeout: AbortError;
}

export type EventListenerType = keyof EventMap;

export type EventCallback<T extends EventListenerType> = EventMap[T] extends undefined
  ? () => void
  : (event: EventMap[T]) => void;

export type OnAbortCallback = (error: AbortError) => void;

export interface EventListenerOptions {
  onAbort?: OnAbortCallback;
  onStateChange?: OnStateChangeCallback;
}
