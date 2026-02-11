import { rethrowAbortError } from './rethrow-abort-error.lib';
import { AbortError } from '../../abort-error';

describe('rethrowAbortError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('В нестрогом режиме (isStrict = false по умолчанию)', () => {
    it('не должна выбрасывать ошибку если isAbortError возвращает false', () => {
      const error = new Error('Regular error');

      expect(() => rethrowAbortError(error)).not.toThrow();
    });

    it('должна выбрасывать ошибку если isAbortError возвращает true', () => {
      const abortError = new AbortError('Aborted');

      expect(() => rethrowAbortError(abortError)).toThrow(abortError);
    });

    it('должна корректно обрабатывать не-AbortError ошибки', () => {
      const testCases = [
        new TypeError('Type error'),
        new RangeError('Range error'),
        new SyntaxError('Syntax error'),
        'plain string error',
        404,
        null,
        undefined,
        { message: 'Error object' }
      ];

      testCases.forEach((error) => {
        expect(() => rethrowAbortError(error)).not.toThrow();
      });
    });
  });

  describe('В строгом режиме (isStrict = true)', () => {
    it('должна выбрасывать ошибку если это экземпляр AbortError', () => {
      const abortError = new AbortError('Aborted');

      expect(() => rethrowAbortError(abortError, { isStrict: true })).toThrow(abortError);
    });

    it('не должна выбрасывать ошибку если это не экземпляр AbortError', () => {
      const error = new Error('Regular error');

      expect(() => rethrowAbortError(error, { isStrict: true })).not.toThrow();
    });

    it('должна использовать instanceof проверку а не isAbortError', () => {
      const customError = {
        name: 'AbortError',
        message: 'Custom abort'
      };

      expect(() => rethrowAbortError(customError, { isStrict: true })).not.toThrow();
    });

    it('должна корректно обрабатывать null и undefined в строгом режиме', () => {
      rethrowAbortError(null, { isStrict: true });

      expect(() => rethrowAbortError(null, { isStrict: true })).not.toThrow();
      expect(() => rethrowAbortError(undefined, { isStrict: true })).not.toThrow();
    });

    it('должна вести себя одинаково для экземпляров AbortError', () => {
      const abortError = new AbortError('Aborted');

      expect(() => rethrowAbortError(abortError)).toThrow(abortError);
      expect(() => rethrowAbortError(abortError, { isStrict: true })).toThrow(abortError);
    });
  });

  describe('Интеграционные сценарии', () => {
    it('должна работать в блоке try-catch', () => {
      const abortError = new AbortError('Operation aborted');
      let caughtError = null;

      try {
        try {
          throw abortError;
        } catch (error) {
          rethrowAbortError(error);
        }
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBe(abortError);
    });

    it('должна позволять обрабатывать не-abort ошибки отдельно', () => {
      const networkError = new Error('Network error');
      let handledError = null;
      let abortErrorThrown = false;

      try {
        try {
          throw networkError;
        } catch (error) {
          rethrowAbortError(error);
          handledError = error;
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          abortErrorThrown = true;
        }
      }

      expect(handledError).toBe(networkError);
      expect(abortErrorThrown).toBe(false);
    });

    it('должна использоваться в цепочках обработки ошибок', async () => {
      const abortError = new AbortError('Aborted');
      const result = await Promise.resolve()
        .then(() => {
          throw abortError;
        })
        .catch((error) => {
          try {
            rethrowAbortError(error);

            return 'not-abort';
          } catch (rethrownError) {
            return rethrownError;
          }
        });

      expect(result).toBe(abortError);
    });
  });

  describe('Краевые случаи', () => {
    it('должна корректно обрабатывать объекты без свойства name', () => {
      const error = { message: 'Error without name' };

      expect(() => rethrowAbortError(error)).not.toThrow();
    });

    it('должна корректно работать с наследованными AbortError', () => {
      class CustomAbortError extends AbortError {
        constructor(message: string) {
          super(message);
          // eslint-disable-next-line dot-notation
          this['customProperty'] = 'custom';
        }
      }

      const customError = new CustomAbortError('Custom abort');

      expect(() => rethrowAbortError(customError, { isStrict: true })).toThrow(customError);

      expect(() => rethrowAbortError(customError)).toThrow(customError);
    });

    it('должна сохранять стек вызовов при переброске', () => {
      const abortError = new AbortError('Aborted');
      const originalStackTrace = abortError.stack;

      try {
        rethrowAbortError(abortError);
      } catch (error) {
        expect(error.stack).toBe(originalStackTrace);
      }
    });
  });
});
