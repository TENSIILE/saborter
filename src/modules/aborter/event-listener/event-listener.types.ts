import { AbortError } from '../../../features/abort-error';

export interface EventMap {
  abort: AbortError;
}

export type EventListenerType = keyof EventMap;

export type OnAbortCallback = (error: AbortError) => void;

export interface EventListenerOptions {
  onabort?: OnAbortCallback;
}
