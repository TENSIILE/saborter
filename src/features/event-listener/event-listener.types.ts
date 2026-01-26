import { AbortError } from '../abort-error';
import { OnStateChangeCallback } from '../state-observer';

export interface EventMap {
  aborted: AbortError;
  cancelled: AbortError;
}

export type EventListenerType = keyof EventMap;

export type EventCallback<T extends EventListenerType> = EventMap[T] extends undefined
  ? () => void
  : (event: EventMap[T]) => void;

export interface EventListenerOptions {
  once?: boolean;
}

export type OnAbortCallback = (error: AbortError) => void;

export interface EventListenerConstructorOptions {
  onAbort?: OnAbortCallback;
  onStateChange?: OnStateChangeCallback;
}

export interface ListenerWrapper<K extends EventListenerType> {
  originalListener: (event: EventMap[K]) => any;
  wrappedListener?: (event: EventMap[K]) => any;
}
