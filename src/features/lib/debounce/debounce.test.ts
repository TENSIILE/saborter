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

    it('должна обогащать AbortError: устанавливать cause и initiator = "debounce"', async () => {
      const originalAbortError = new AbortError('Signal aborted');
      (setTimeoutAsync as jest.Mock).mockImplementation(() => {
        throw originalAbortError;
      });

      const debouncedFn = debounce(jest.fn(), 100);
      const { signal } = new AbortController();

      expect(() => debouncedFn(signal)).toThrow(AbortError);

      // We check that the original error has been modified
      expect(originalAbortError.cause).toBeInstanceOf(AbortError);
      expect((originalAbortError.cause as Error).message).toBe('Signal aborted');
      expect(originalAbortError.cause).not.toBe(originalAbortError); // there must be a new copy
      expect(originalAbortError.initiator).toBe('debounce');
    });

    it('должна корректно обогащать AbortError с дополнительными полями (reason, metadata и т.д.)', async () => {
      const originalAbortError = new AbortError('Timeout', {
        reason: 'User cancelled',
        metadata: { id: 42 }
      });
      (setTimeoutAsync as jest.Mock).mockImplementation(() => {
        throw originalAbortError;
      });

      const debouncedFn = debounce(jest.fn(), 100);
      expect(() => debouncedFn(new AbortController().signal)).toThrow(AbortError);

      expect(originalAbortError.cause).toBeInstanceOf(AbortError);
      expect((originalAbortError.cause as AbortError).reason).toBe('User cancelled');
      expect((originalAbortError.cause as AbortError).metadata).toEqual({ id: 42 });
      expect(originalAbortError.initiator).toBe('debounce');
    });
  });

  describe('синхронные ошибки из setTimeoutAsync', () => {
    it('должна перехватывать синхронно выброшенный AbortError и обогащать его', () => {
      const originalAbortError = new AbortError('sync abort');

      (setTimeoutAsync as jest.Mock).mockImplementation(() => {
        throw originalAbortError;
      });

      const debouncedFn = debounce(jest.fn(), 100);
      const { signal } = new AbortController();

      expect(() => debouncedFn(signal)).toThrow(AbortError);
      expect(originalAbortError.cause).toBeInstanceOf(AbortError);
      expect(originalAbortError.initiator).toBe('debounce');
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
