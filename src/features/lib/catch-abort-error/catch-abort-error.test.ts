/* eslint-disable no-plusplus */
/* eslint-disable max-classes-per-file */
import { catchAbortError } from './catch-abort-error.lib';
import { AbortError } from '../../abort-error';

describe('catchAbortError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('В нестрогом режиме (isStrict = false по умолчанию)', () => {
    it('должна перебрасывать ошибку если isAbortError возвращает false', () => {
      const error = new Error('Regular error');

      expect(() => catchAbortError(error)).toThrow(error);
      expect(() => catchAbortError(error)).toThrow('Regular error');
    });

    it('не должна перебрасывать ошибку если isAbortError возвращает true', () => {
      const abortError = new AbortError('Aborted');

      expect(() => catchAbortError(abortError)).not.toThrow();
    });

    it('должна вызывать isAbortError с переданной ошибкой', () => {
      const error = new Error('Test error');

      expect(() => catchAbortError(error)).toThrow();
    });

    it('должна корректно обрабатывать разные типы ошибок', () => {
      const nonAbortErrors = [
        new TypeError('Type error'),
        new RangeError('Range error'),
        new SyntaxError('Syntax error'),
        'plain string error',
        404,
        { message: 'Error object' }
      ];

      nonAbortErrors.forEach((error) => {
        expect(() => catchAbortError(error)).toThrow();
      });
    });
  });

  describe('В строгом режиме (isStrict = true)', () => {
    it('не должна перебрасывать ошибку если это экземпляр AbortError', () => {
      const abortError = new AbortError('Aborted');

      expect(() => catchAbortError(abortError, { isStrict: true })).not.toThrow();
    });

    it('должна перебрасывать ошибку если это не экземпляр AbortError', () => {
      const error = new Error('Regular error');

      expect(() => catchAbortError(error, { isStrict: true })).toThrow(error);
    });

    it('должна использовать instanceof проверку а не isAbortError для экземпляров AbortError', () => {
      const abortError = new AbortError('Aborted');

      expect(() => catchAbortError(abortError, { isStrict: true })).not.toThrow();
    });

    it('должна перебрасывать кастомные abort-like объекты в строгом режиме', () => {
      const customError = {
        name: 'AbortError',
        message: 'Custom abort'
      };

      expect(() => catchAbortError(customError, { isStrict: true })).toThrow(customError);
    });
  });

  describe('Сравнение строгого и нестрогого режимов', () => {
    it('должна вести себя одинаково для экземпляров AbortError', () => {
      const abortError = new AbortError('Aborted');

      // В обоих режимах не должна перебрасывать
      expect(() => catchAbortError(abortError)).not.toThrow();
      expect(() => catchAbortError(abortError, { isStrict: true })).not.toThrow();
    });

    it('должна вести себя по-разному для не-экземпляров, которые isAbortError считает abort errors', () => {
      const customAbortError = {
        name: 'AbortError',
        message: 'Custom abort',
        isAbort: true
      };

      // В нестрогом режиме - не перебрасывает
      expect(() => catchAbortError(customAbortError)).not.toThrow();

      // В строгом режиме - перебрасывает
      expect(() => catchAbortError(customAbortError, { isStrict: true })).toThrow(customAbortError);
    });
  });

  describe('Поведение с null и undefined', () => {
    it('должна перебрасывать null как ошибку', () => {
      expect(() => catchAbortError(null)).toThrow();
    });

    it('должна перебрасывать undefined как ошибку', () => {
      expect(() => catchAbortError(undefined)).toThrow();
    });

    it('должна перебрасывать null и undefined в строгом режиме', () => {
      expect(() => catchAbortError(null, { isStrict: true })).toThrow();
      expect(() => catchAbortError(undefined, { isStrict: true })).toThrow();
    });
  });

  describe('Интеграционные сценарии', () => {
    it('должна работать в блоке try-catch для фильтрации abort ошибок', () => {
      const abortError = new AbortError('Operation aborted');
      let wasAbortError = false;
      let otherError = null;

      // Тест 1: abort error должна быть поймана и не переброшена
      try {
        try {
          throw abortError;
        } catch (error) {
          catchAbortError(error);
          // Этот код должен выполниться для abort error
          wasAbortError = true;
        }
      } catch (error) {
        otherError = error;
      }

      expect(wasAbortError).toBe(true);
      expect(otherError).toBeNull();

      // Тест 2: другие ошибки должны быть переброшены
      const regularError = new Error('Network error');
      wasAbortError = false;
      otherError = null;

      try {
        try {
          throw regularError;
        } catch (error) {
          catchAbortError(error);
          wasAbortError = true;
        }
      } catch (error) {
        otherError = error;
      }

      expect(wasAbortError).toBe(false);
      expect(otherError).toBe(regularError);
    });

    it('должна использоваться в асинхронных операциях для игнорирования отмен', async () => {
      const abortError = new AbortError('Aborted');
      const regularError = new Error('Network error');

      // Симуляция асинхронной операции
      const simulateAsync = async (errorToThrow) => {
        throw errorToThrow;
      };

      // Test 1: abort error должна быть проигнорирована
      await expect(
        simulateAsync(abortError).catch((error) => {
          catchAbortError(error);

          return 'aborted-ignored';
        })
      ).resolves.toBe('aborted-ignored');

      await expect(
        simulateAsync(regularError).catch((error) => {
          catchAbortError(error);

          return 'should-not-reach-here';
        })
      ).rejects.toThrow('Network error');
    });

    it('должна работать в цепочках промисов', async () => {
      const abortError = new AbortError('Aborted');

      const result = await Promise.resolve()
        .then(() => {
          throw abortError;
        })
        .catch((error) => {
          try {
            catchAbortError(error);

            return 'abort-ignored';
          } catch (rethrownError) {
            return rethrownError;
          }
        });

      expect(result).toBe('abort-ignored');
    });

    it('должна позволять продолжать выполнение после отмены операции', () => {
      const controller = new AbortController();
      const results: string[] = [];

      const processWithSignal = (signal: AbortSignal) => {
        for (let i = 0; i < 5; i++) {
          try {
            // Симуляция операции, которая может выбросить abort error
            if (signal.aborted) {
              throw new AbortError('Operation aborted');
            }
            results.push(`item-${i}`);
          } catch (error) {
            catchAbortError(error);
            break; // Выходим из цикла если операция отменена
          }
        }
      };

      processWithSignal(controller.signal);
      expect(results).toEqual(['item-0', 'item-1', 'item-2', 'item-3', 'item-4']);

      // Сбросим и попробуем с отменой
      results.length = 0;
      const controller2 = new AbortController();

      // Симуляция отмены после 2 итераций
      let iteration = 0;
      const processWithAbort = () => {
        for (let i = 0; i < 5; i++) {
          try {
            iteration = i;
            if (i === 2) {
              controller2.abort();
              throw new AbortError('Operation aborted');
            }
            results.push(`item-${i}`);
          } catch (error) {
            catchAbortError(error);
            break;
          }
        }
      };

      processWithAbort();
      expect(results).toEqual(['item-0', 'item-1']);
      expect(iteration).toBe(2);
    });
  });

  describe('Краевые случаи', () => {
    it('должна сохранять стек вызовов при переброске не-abort ошибок', () => {
      const error = new Error('Some error');
      const originalStackTrace = error.stack;

      try {
        catchAbortError(error);
      } catch (rethrownError) {
        expect(rethrownError.stack).toBe(originalStackTrace);
      }
    });

    it('должна корректно работать с наследованными AbortError', () => {
      class CustomAbortError extends AbortError {
        constructor(message) {
          super(message);
          // eslint-disable-next-line dot-notation
          this['customProperty'] = 'custom';
        }
      }

      const customError = new CustomAbortError('Custom abort');

      expect(() => catchAbortError(customError, { isStrict: true })).not.toThrow();

      expect(() => catchAbortError(customError)).not.toThrow();
    });

    it('должна корректно обрабатывать объекты без свойства name', () => {
      const error = { message: 'Error without name' };

      expect(() => catchAbortError(error)).toThrow(error as Error);
    });

    it('должна корректно работать с уже переброшенными ошибками', () => {
      const abortError = new AbortError('Aborted');

      try {
        throw abortError;
      } catch (error) {
        expect(() => catchAbortError(error)).not.toThrow();

        expect(() => catchAbortError(error)).not.toThrow();
      }
    });
  });

  describe('Комбинирование с другими функциями обработки ошибок', () => {
    it('должна работать совместно с throwIfAborted', () => {
      const controller = new AbortController();
      const results: string[] = [];

      const safeOperation = (signal: AbortSignal) => {
        try {
          if (signal.aborted) {
            throw new AbortError('Aborted');
          }
          results.push('operation-completed');
        } catch (error) {
          catchAbortError(error);
          results.push('operation-aborted');
        }
      };

      safeOperation(controller.signal);
      expect(results).toEqual(['operation-completed']);

      controller.abort();
      results.length = 0;

      safeOperation(controller.signal);
      expect(results).toEqual(['operation-aborted']);
    });

    it('должна дополнять rethrowAbortError для разных сценариев обработки', () => {
      const abortError = new AbortError('Aborted');
      const networkError = new Error('Network error');

      expect(() => {
        try {
          throw abortError;
        } catch (error) {
          catchAbortError(error);
        }
      }).not.toThrow();

      expect(() => {
        try {
          throw networkError;
        } catch (error) {
          catchAbortError(error);
        }
      }).toThrow('Network error');
    });
  });
});
