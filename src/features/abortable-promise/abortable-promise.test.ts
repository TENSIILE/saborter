import { AbortablePromise } from './abortable-promise';

describe('AbortablePromise', () => {
  describe('Конструктор', () => {
    it('должен создавать обычный промис, если сигнал не передан', async () => {
      const promise = new AbortablePromise((resolve) => {
        resolve('успех');
      });

      await expect(promise).resolves.toBe('успех');
    });

    it('должен создавать промис, который корректно отклоняется при ошибке в executor', async () => {
      const error = new Error('Ошибка выполнения');
      const promise = new AbortablePromise((_, reject) => {
        reject(error);
      });

      await expect(promise).rejects.toThrow(error);
    });

    it('должен корректно обрабатывать асинхронные операции', async () => {
      const promise = new AbortablePromise((resolve) => {
        setTimeout(() => resolve('готово'), 50);
      });

      await expect(promise).resolves.toBe('готово');
    });
  });

  describe('Поведение с AbortSignal', () => {
    it('должен отклонять промис, если сигнал был отменён до разрешения промиса', async () => {
      const controller = new AbortController();
      const reason = 'Отмена операции';

      const promise = new AbortablePromise((resolve) => {
        setTimeout(() => resolve('успех'), 100);
      }, controller.signal);

      controller.abort(reason);

      await expect(promise).rejects.toBe(reason);
    });

    it('должен отклонять промис с причиной отмены, даже если это не ошибка', async () => {
      const controller = new AbortController();
      const reason = { code: 999, text: 'Пользователь отменил' };

      const promise = new AbortablePromise((resolve) => {
        setTimeout(() => resolve('успех'), 100);
      }, controller.signal);

      controller.abort(reason);

      await expect(promise).rejects.toEqual(reason);
    });

    it('НЕ должен отклонять промис, если сигнал был отменён после разрешения промиса', async () => {
      const controller = new AbortController();
      let resolved = false;

      const promise = new AbortablePromise((resolve) => {
        setTimeout(() => {
          resolved = true;
          resolve('успех');
        }, 50);
      }, controller.signal);

      await expect(promise).resolves.toBe('успех');
      expect(resolved).toBe(true);

      controller.abort('Поздно');

      await expect(promise).resolves.toBe('успех');
    });

    it('НЕ должен отклонять промис, если сигнал был отменён после отклонения промиса', async () => {
      const controller = new AbortController();
      const originalError = new Error('Первичная ошибка');

      const promise = new AbortablePromise((_, reject) => {
        setTimeout(() => reject(originalError), 50);
      }, controller.signal);

      await expect(promise).rejects.toThrow(originalError);

      controller.abort('Поздняя отмена');
      await expect(promise).rejects.toThrow(originalError);
    });

    it('должен автоматически отклонять промис, если сигнал УЖЕ отменён до создания промиса', async () => {
      const controller = new AbortController();
      controller.abort('Уже отменено');

      const promise = new AbortablePromise((resolve) => {
        resolve('несмотря на отмену');
      }, controller.signal);

      await expect(promise).rejects.toBe('Уже отменено');
    });

    it('должен позволять вручную проверить signal.aborted внутри executor, если нужно', async () => {
      const controller = new AbortController();
      controller.abort('Уже отменено');

      const promise = new AbortablePromise((resolve, reject) => {
        if (controller.signal.aborted) {
          reject(controller.signal.reason);
        } else {
          resolve('успех');
        }
      }, controller.signal);

      await expect(promise).rejects.toBe('Уже отменено');
    });
  });

  describe('Граничные случаи', () => {
    it('должен корректно работать с undefined в качестве сигнала', async () => {
      const promise = new AbortablePromise((resolve) => {
        resolve('ok');
      }, undefined);

      await expect(promise).resolves.toBe('ok');
    });

    it('должен корректно обрабатывать null в качестве сигнала', async () => {
      const promise = new AbortablePromise((resolve) => {
        resolve('ok');
      }, null as any);

      await expect(promise).resolves.toBe('ok');
    });

    it('должен игнорировать повторные вызовы reject от сигнала, если промис уже отклонён', async () => {
      const controller = new AbortController();
      const rejectSpy = jest.fn();

      const promise = new AbortablePromise((_, reject) => {
        const wrappedReject = (reason: any) => {
          rejectSpy(reason);
          reject(reason);
        };

        setTimeout(() => wrappedReject(new Error('Первая ошибка')), 10);
      }, controller.signal);

      await expect(promise).rejects.toThrow('Первая ошибка');

      controller.abort('Вторая ошибка');

      expect(rejectSpy).toHaveBeenCalledTimes(1);
      expect(rejectSpy).toHaveBeenCalledWith(new Error('Первая ошибка'));
    });

    it('должен корректно работать в цепочках then/catch', async () => {
      const controller = new AbortController();
      const promise = new AbortablePromise<number>((resolve) => {
        setTimeout(() => resolve(42), 50);
      }, controller.signal);

      const result = await promise.then((x) => x * 2).then((x) => x + 1);

      expect(result).toBe(85);

      controller.abort();
    });
  });
});
