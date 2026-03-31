import { debounce } from './debounce.lib';
import { setTimeoutAsync } from '../set-timeout-async';
import { AbortError } from '../../abort-error';

jest.mock('../set-timeout-async', () => ({
  setTimeoutAsync: jest.fn()
}));

describe('debounce', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен возвращать функцию', () => {
    const handler = jest.fn();
    const debouncedFn = debounce(handler, 100);
    expect(typeof debouncedFn).toBe('function');
  });

  describe('возвращённая функция', () => {
    it('должна вызывать setTimeoutAsync с переданными handler, timeout и сигналом', () => {
      const handler = jest.fn();
      const debouncedFn = debounce(handler, 200);
      const { signal } = new AbortController();

      debouncedFn(signal);

      expect(setTimeoutAsync).toHaveBeenCalledTimes(1);
      expect(setTimeoutAsync).toHaveBeenCalledWith(handler, 200, { signal });
    });

    it('должна возвращать результат от setTimeoutAsync при успешном выполнении', async () => {
      const result = 'success';
      (setTimeoutAsync as jest.Mock).mockResolvedValue(result);

      const debouncedFn = debounce(jest.fn(), 100);
      const promise = debouncedFn(new AbortController().signal);

      await expect(promise).resolves.toBe(result);
    });

    it('должна пробрасывать ошибку, не являющуюся AbortError, без изменений', async () => {
      const error = new Error('network error');
      (setTimeoutAsync as jest.Mock).mockRejectedValue(error);

      const debouncedFn = debounce(jest.fn(), 100);
      const promise = debouncedFn(new AbortController().signal);

      await expect(promise).rejects.toThrow(error);
      expect((error as any).cause).toBeUndefined();
      expect((error as any).initiator).toBeUndefined();
    });

    it('должна возвращать новый AbortError: initiator = "debounce" и сохранение истории ошибок в cause', async () => {
      const originalAbortError = new AbortError('Signal aborted', { initiator: setTimeoutAsync.name });

      (setTimeoutAsync as jest.Mock).mockImplementation(() => {
        throw originalAbortError;
      });

      const debouncedFn = debounce(jest.fn(), 100);
      const { signal } = new AbortController();

      const fn = () => {
        try {
          debouncedFn(signal);
        } catch (error) {
          return error;
        }
      };

      expect(fn()).toEqual(
        new AbortError('Signal aborted', {
          initiator: debounce.name,
          cause: originalAbortError
        })
      );
    });

    it('должна возвращать новый AbortError с дополнительными полями (reason, metadata и т.д.)', async () => {
      const originalAbortError = new AbortError('Timeout', {
        reason: 'User cancelled',
        metadata: { id: 42 }
      });

      (setTimeoutAsync as jest.Mock).mockImplementation(() => {
        throw originalAbortError;
      });

      const debouncedFn = debounce(jest.fn(), 100);

      const fn = () => {
        try {
          debouncedFn(new AbortController().signal);
        } catch (error) {
          return error;
        }
      };

      expect(fn()).toEqual(
        new AbortError('Timeout', {
          initiator: debounce.name,
          reason: originalAbortError.reason,
          metadata: originalAbortError.metadata,
          cause: originalAbortError
        })
      );
    });
  });

  describe('синхронные ошибки из setTimeoutAsync', () => {
    it('должна перехватывать синхронно выброшенный AbortError и возращать новый экземпляр', () => {
      const originalAbortError = new AbortError('sync abort');

      (setTimeoutAsync as jest.Mock).mockImplementation(() => {
        throw originalAbortError;
      });

      const debouncedFn = debounce(jest.fn(), 100);
      const { signal } = new AbortController();

      const fn = () => {
        try {
          debouncedFn(signal);
        } catch (error) {
          return error;
        }
      };

      expect(fn()).toEqual(
        new AbortError('sync abort', {
          initiator: debounce.name,
          cause: originalAbortError
        })
      );
    });

    it('должна пробрасывать синхронную ошибку, не являющуюся AbortError', () => {
      const error = new TypeError('invalid argument');

      (setTimeoutAsync as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const debouncedFn = debounce(jest.fn(), 100);
      const { signal } = new AbortController();

      expect(() => debouncedFn(signal)).toThrow(error);
      expect((error as any).cause).toBeUndefined();
    });
  });

  describe('граничные случаи', () => {
    it('должна корректно обрабатывать handler = undefined (ожидаемая ошибка от setTimeoutAsync)', () => {
      const debouncedFn = debounce(undefined as any, 100);
      const { signal } = new AbortController();

      (setTimeoutAsync as jest.Mock).mockImplementation(() => {
        throw new TypeError('handler is not a function');
      });

      expect(() => debouncedFn(signal)).toThrow(TypeError);
    });
  });
});
