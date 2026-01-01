export type AbortRequest<T> = (signal: AbortSignal) => Promise<T>;

export interface FnTryOptions {
  /**
   * Возвращает возможность получить ошибку отмененного запроса в блоке catch.
   * @default false
   */
  isErrorNativeBehavior?: boolean;
}

export type AbortErrorCallback = (error: Error) => void;

export interface AborterOptions {
  onAbort?: AbortErrorCallback;
}
