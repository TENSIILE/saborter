import * as Utils from './utils';
import * as Constants from './constants';
import * as Types from './types';

export class Aborter {
  protected abortController = new AbortController();

  public static isError = Utils.isError;

  /**
   * Возвращает объект AbortSignal, связанный с этим объектом.
   */
  public get signal(): AbortSignal {
    return this.abortController.signal;
  }

  public try = <R>(
    request: Types.AbortRequest<R>,
    { isNativeBehavior = false }: Types.AborterOptions = {}
  ): Promise<R> => {
    // На первой итерации создается переменная с присвоением promise, в котором мы ожидаем его выполнение.
    let promise: Promise<R> | null = new Promise<R>((resolve, reject) => {
      this.abort();

      this.abortController = new AbortController();

      const { signal } = this.abortController;

      request(signal)
        .then(resolve)
        .catch((err: Error) => {
          const error: Error = {
            ...err,
            message:
              err?.message ||
              Utils.get(err, Constants.ERROR_CAUSE_PATH_MESSAGE) ||
              '',
          };

          if (isNativeBehavior || !Aborter.isError(err)) {
            return reject(error);
          }

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
  public abort = () => this.abortController.abort();
}
