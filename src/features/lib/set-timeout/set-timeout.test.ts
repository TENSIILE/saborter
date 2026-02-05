/* eslint-disable no-implied-eval */
import { setTimeout } from './set-timeout.lib';
import { AbortError } from '../../abort-error';

describe('Функция setTimeout', () => {
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
      const promise = setTimeout(handler, 100);

      globalThis.setTimeout(async () => {
        await expect(promise).resolves.toBe(42);
        expect(handler).toHaveBeenCalledWith(expect.any(AbortSignal));
      });
    });

    it('должна разрешать промис с результатом асинхронной функции', () => {
      const handler = jest.fn().mockResolvedValue('async result');
      const promise = setTimeout(handler, 100);

      globalThis.setTimeout(async () => {
        await expect(promise).resolves.toBe('async result');
      });
    });

    it('должна отклонять промис если асинхронная функция выбрасывает ошибку', () => {
      const error = new Error('Async error');
      const handler = jest.fn().mockRejectedValue(error);
      const promise = setTimeout(handler, 100);

      globalThis.setTimeout(async () => {
        await expect(promise).rejects.toThrow('Async error');
      });
    });

    it('должна отклонять промис если синхронная функция выбрасывает ошибку', () => {
      const error = new Error('Sync error');
      const handler = jest.fn().mockImplementation(() => {
        throw error;
      });
      const promise = setTimeout(handler, 100);

      globalThis.setTimeout(async () => {
        await expect(promise).rejects.toThrow('Sync error');
      });
    });
  });

  describe('Работа с обработчиком-строкой', () => {
    it('должна выполнять строку как код и возвращать результат', () => {
      const promise = setTimeout('return 42;', 100, { args: [] });

      globalThis.setTimeout(async () => {
        await expect(promise).resolves.toBe(42);
      }, 100);
    });

    it('должна передавать аргументы в код строки', () => {
      const promise = setTimeout('return a + b;', 100, { args: [10, 32] });

      globalThis.setTimeout(async () => {
        await expect(promise).resolves.toBe(42);
      }, 100);
    });

    it('должна отклонять промис если строка кода выбрасывает ошибку', () => {
      const promise = setTimeout('throw new Error("Code error");', 100);

      globalThis.setTimeout(async () => {
        await expect(promise).rejects.toThrow('Code error');
      }, 100);
    });
  });

  describe('Работа с таймаутом', () => {
    it('должна вызывать обработчик без задержки если timeout не указан', () => {
      const handler = jest.fn().mockReturnValue('immediate');
      const promise = setTimeout(handler);

      globalThis.setTimeout(async () => {
        await expect(promise).resolves.toBe('immediate');
      });
    });

    it('должна корректно работать с нулевым таймаутом', async () => {
      const handler = jest.fn().mockReturnValue('zero');
      const promise = setTimeout(handler, 0);

      globalThis.setTimeout(async () => {
        await expect(promise).resolves.toBe('zero');
      });
    });

    it('не должна вызывать обработчик до истечения таймаута', () => {
      const handler = jest.fn();
      setTimeout(handler, 100);

      globalThis.setTimeout(async () => {
        expect(handler).not.toHaveBeenCalled();
      });

      globalThis.setTimeout(async () => {
        expect(handler).toHaveBeenCalled();
      }, 100);
    });
  });

  describe('Работа с AbortSignal', () => {
    it('должна отклонять промис с AbortError при отмене сигнала', async () => {
      const controller = new AbortController();
      const handler = jest.fn();
      const promise = setTimeout(handler, 1000, { signal: controller.signal });

      controller.abort();

      await expect(promise).rejects.toThrow(AbortError);
      expect(handler).not.toHaveBeenCalled();
    });

    it('должна очищать таймаут при отмене сигнала', async () => {
      const controller = new AbortController();
      const handler = jest.fn();
      const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');

      setTimeout(handler, 1000, { signal: controller.signal });
      controller.abort();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('должна добавлять информацию об инициаторе в причину отмены', async () => {
      const controller = new AbortController();
      const handler = jest.fn();

      try {
        setTimeout(handler, 1000, { signal: controller.signal });

        controller.abort('Operation cancelled');
      } catch (error) {
        expect(error.initiator).toBe('setTimeout');
        expect(error.cause).toBeInstanceOf(AbortError);
      }
    });

    it('должна создавать внутренний AbortController если сигнал не передан', async () => {
      const handler = jest.fn().mockReturnValue('no signal');
      const promise = setTimeout(handler, 100);

      globalThis.setTimeout(async () => {
        await expect(promise).resolves.toBe('no signal');
      });
    });
  });

  describe('Краевые случаи', () => {
    it('должна корректно работать с undefined и null как аргументами', async () => {
      const promise = setTimeout('return [a, b];', 100, { args: [undefined, null] });

      globalThis.setTimeout(async () => {
        await expect(promise).resolves.toEqual([undefined, null]);
      });
    });

    it('должна корректно обрабатывать уже отмененный сигнал', async () => {
      const controller = new AbortController();
      controller.abort();
      const handler = jest.fn();

      const promise = setTimeout(handler, 1000, { signal: controller.signal });

      await expect(promise).rejects.toThrow(AbortError);
      expect(handler).not.toHaveBeenCalled();
    });

    it('должна использовать пустой массив по умолчанию для args', async () => {
      const promise = setTimeout('return arguments.length;', 100);

      globalThis.setTimeout(async () => {
        await expect(promise).resolves.toBe(0);
      });
    });
  });
});
