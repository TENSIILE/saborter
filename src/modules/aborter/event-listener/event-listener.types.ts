import { AbortError } from '../../../features/abort-error';

export interface EventMap {
  aborted: AbortError;
  cancelled: AbortError;
}

export type EventListenerType = keyof EventMap;

export type EventCallback<T extends EventListenerType> = EventMap[T] extends undefined
  ? () => void
  : (event: EventMap[T]) => void;

export type OnAbortCallback = (error: AbortError) => void;

export interface EventListenerOptions {
  onabort?: OnAbortCallback;
}
