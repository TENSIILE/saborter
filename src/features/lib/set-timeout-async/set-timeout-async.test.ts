/* eslint-disable no-implied-eval */
import { setTimeoutAsync } from './set-timeout-async.lib';
import { AbortError } from '../../abort-error';

describe('setTimeoutAsync', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Работа с обработчиком-функцией', () => {
    it('должна разрешать промис с результатом синхронной функции', () => {
      const handler = jest.fn().mockReturnValue(42);
      const promise = setTimeoutAsync(handler, 100);

      setTimeout(async () => {
        await expect(promise).resolves.toBe(42);
        expect(handler).toHaveBeenCalledWith(expect.any(AbortSignal));
      });
    });

    it('должна разрешать промис с результатом асинхронной функции', () => {
      const handler = jest.fn().mockResolvedValue('async result');
      const promise = setTimeoutAsync(handler, 100);

      setTimeout(async () => {
        await expect(promise).resolves.toBe('async result');
      });
    });

    it('должна отклонять промис если асинхронная функция выбрасывает ошибку', () => {
      const error = new Error('Async error');
      const handler = jest.fn().mockRejectedValue(error);
      const promise = setTimeoutAsync(handler, 100);

      setTimeout(async () => {
        await expect(promise).rejects.toThrow('Async error');
      });
    });

    it('должна отклонять промис если синхронная функция выбрасывает ошибку', () => {
      const error = new Error('Sync error');
      const handler = jest.fn().mockImplementation(() => {
        throw error;
      });
      const promise = setTimeoutAsync(handler, 100);

      setTimeout(async () => {
        await expect(promise).rejects.toThrow('Sync error');
      });
    });
  });

  describe('Работа с обработчиком-строкой', () => {
    it('должна выполнять строку как код и возвращать результат', () => {
      const promise = setTimeoutAsync('return 42;', 100, { args: [] });

      setTimeout(async () => {
        await expect(promise).resolves.toBe(42);
      }, 100);
    });

    it('должна передавать аргументы в код строки', () => {
      const promise = setTimeoutAsync('return a + b;', 100, { args: [10, 32] });

      setTimeout(async () => {
        await expect(promise).resolves.toBe(42);
      }, 100);
    });

    it('должна отклонять промис если строка кода выбрасывает ошибку', () => {
      const promise = setTimeoutAsync('throw new Error("Code error");', 100);

      setTimeout(async () => {
        await expect(promise).rejects.toThrow('Code error');
      }, 100);
    });
  });

  describe('Работа с таймаутом', () => {
    it('должна вызывать обработчик без задержки если timeout не указан', () => {
      const handler = jest.fn().mockReturnValue('immediate');
      const promise = setTimeoutAsync(handler);

      setTimeout(async () => {
        await expect(promise).resolves.toBe('immediate');
      });
    });

    it('должна корректно работать с нулевым таймаутом', async () => {
      const handler = jest.fn().mockReturnValue('zero');
      const promise = setTimeoutAsync(handler, 0);

      setTimeout(async () => {
        await expect(promise).resolves.toBe('zero');
      });
    });

    it('не должна вызывать обработчик до истечения таймаута', () => {
      const handler = jest.fn();
      setTimeoutAsync(handler, 100);

      setTimeout(async () => {
        expect(handler).not.toHaveBeenCalled();
      });

      setTimeout(async () => {
        expect(handler).toHaveBeenCalled();
      }, 100);
    });
  });

  describe('Работа с AbortSignal', () => {
    it('должна отклонять промис с пустой причиной при отмене сигнала', async () => {
      const controller = new AbortController();
      const handler = jest.fn();

      const promise = setTimeoutAsync(handler, 1000, { signal: controller.signal });

      controller.abort();

      await expect(promise).rejects.toThrow(AbortError);
      expect(handler).not.toHaveBeenCalled();
    });

    it('должна отклонять промис с AbortError при отмене сигнала', async () => {
      const controller = new AbortController();
      const handler = jest.fn();

      const promise = setTimeoutAsync(handler, 1000, { signal: controller.signal });

      controller.abort(new AbortError('aborted'));

      await expect(promise).rejects.toThrow(AbortError);
      expect(handler).not.toHaveBeenCalled();
    });

    it('должна очищать таймаут при отмене сигнала', async () => {
      const controller = new AbortController();
      const handler = jest.fn();

      const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');

      const promise = setTimeoutAsync(handler, 1000, { signal: controller.signal });
      controller.abort();

      await expect(promise).rejects.toThrow(AbortError);

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('должна добавлять информацию об инициаторе в причину отмены', async () => {
      const controller = new AbortController();
      const handler = jest.fn();

      try {
        const promise = setTimeoutAsync(handler, 2000, { signal: controller.signal });
        controller.abort('Operation cancelled');

        await expect(promise).rejects.toThrow(AbortError);
      } catch (error) {
        expect(error.initiator).toBe('setTimeoutAsync');
        expect(error.cause).toBeInstanceOf(AbortError);
      }
    });

    it('должна создавать внутренний AbortController если сигнал не передан', async () => {
      const handler = jest.fn().mockReturnValue('no signal');
      const promise = setTimeoutAsync(handler, 100);

      setTimeout(async () => {
        await expect(promise).resolves.toBe('no signal');
      });
    });
  });

  describe('Краевые случаи', () => {
    it('должна корректно работать с undefined и null как аргументами', async () => {
      const promise = setTimeoutAsync('return [a, b];', 100, { args: [undefined, null] });

      setTimeout(async () => {
        await expect(promise).resolves.toEqual([undefined, null]);
      });
    });

    it('должна корректно обрабатывать уже отмененный сигнал', async () => {
      const controller = new AbortController();
      controller.abort();
      const handler = jest.fn();

      const promise = setTimeoutAsync(handler, 1000, { signal: controller.signal });

      await expect(promise).rejects.toThrow(AbortError);
      expect(handler).not.toHaveBeenCalled();
    });

    it('должна использовать пустой массив по умолчанию для args', async () => {
      const promise = setTimeoutAsync('return arguments.length;', 100);

      setTimeout(async () => {
        await expect(promise).resolves.toBe(0);
      });
    });
  });
});
