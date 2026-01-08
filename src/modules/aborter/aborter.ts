import { AbortError, getCauseMessage, isError } from '../../features/abort-error';
import { EventListener } from './event-listener';
import * as Types from './aborter.types';

export class Aborter extends EventListener {
  protected abortController = new AbortController();

  public static isError = isError;

  constructor(options?: Types.AborterOptions) {
    super({ onabort: options?.onabort });
  }

  /**
   * Возвращает объект AbortSignal, связанный с этим объектом.
   */
  public get signal(): AbortSignal {
    return this.abortController.signal;
  }

  public try = <R>(
    request: Types.AbortRequest<R>,
    { isErrorNativeBehavior = false }: Types.FnTryOptions = {},
  ): Promise<R> => {
    // На первой итерации создается переменная с присвоением promise, в котором мы ожидаем его выполнение.
    let promise: Promise<R> | null = new Promise<R>((resolve, reject) => {
      this.abort(new AbortError('cancellation of the previous AbortController', { isCancelled: true }));

      this.abortController = new AbortController();

      const { signal } = this.abortController;

      request(signal)
        .then(resolve)
        .catch((err: Error) => {
          const error: Error = {
            ...err,
            message: err?.message || getCauseMessage(err) || '',
          };

          if (isErrorNativeBehavior || !Aborter.isError(err)) {
            return reject(error);
          }

          const abortError = new AbortError(error.message);

          this.emitEvent('abort', abortError);

          /**
           * Во второй итерации, в случае отмены запроса, мы не завершаем promise, а обнуляем ссылку на него, для того, чтобы
           * garbage collector удалил не завершившийся promise из памяти. После обнуления следующий вызов метода try создает новый promise. При таком подходе наружный блок finally вызовется только при успешном завершении последнего promise или же при получении любой ошибки кроме AbortError.
           */
          promise = null;
        });
    });

    return promise;
  };

  /**
   * Вызов этого метода установить флаг AbortSignal этого объекта и сигнализирует всем наблюдателям, что связанное действие должно быть прервано.
   */
  public abort = (reason?: any) => this.abortController.abort(reason);
}
