export type AbortRequest<T> = (signal: AbortSignal) => Promise<T>;

export interface AborterOptions {
  /**
   * Возвращает возможность получить ошибку отмененного запроса в блоке catch.
   * @default false
   */
  isNativeBehavior?: boolean;
}
