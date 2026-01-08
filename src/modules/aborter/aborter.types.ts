import { EventListenerOptions } from './event-listener/event-listener.types';

export type AbortRequest<T> = (signal: AbortSignal) => Promise<T>;

export interface FnTryOptions {
  /**
   * Возвращает возможность получить ошибку отмененного запроса в блоке catch.
   * @default false
   */
  isErrorNativeBehavior?: boolean;
}

export interface AborterOptions extends Pick<EventListenerOptions, 'onabort'> {}
