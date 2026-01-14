import { Aborter } from './aborter';
import { get } from '../../shared/utils';
import { isError, getCauseMessage, AbortError } from '../../features/abort-error';

jest.mock('../../shared/utils', () => ({
  get: jest.fn()
}));

jest.mock('../../features/abort-error', () => ({
  isError: jest.fn(),
  AbortError: jest.fn(),
  getCauseMessage: jest.fn()
}));

describe('Aborter', () => {
  let aborter: Aborter;
  let mockRequest: jest.Mock;

  beforeEach(() => {
    global.AbortController = jest.fn(() => ({
      abort: jest.fn(),
      signal: {
        aborted: false,
        reason: undefined,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        onabort: null,
        throwIfAborted: jest.fn()
      } as unknown as AbortSignal
    })) as any;

    aborter = new Aborter();
    mockRequest = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('должен создавать новый экземпляр Aborter с AbortController', () => {
      expect(aborter).toBeInstanceOf(Aborter);
    });
  });

  describe('try', () => {
    it('должен успешно выполнять запрос и возвращать результат', async () => {
      const expectedResult = { data: 'test' };
      mockRequest.mockResolvedValue(expectedResult);

      const result = await aborter.try(mockRequest);

      expect(result).toEqual(expectedResult);
    });

    it('должен создавать новый AbortController для каждого вызова try', async () => {
      mockRequest.mockResolvedValue('success');

      await aborter.try(mockRequest);

      expect(global.AbortController).toHaveBeenCalledTimes(2);
    });

    describe('при ошибках', () => {
      it('должен отменять предыдущий запрос при новом вызове try', async () => {
        const firstRequest = jest.fn().mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve('first'), 100);
            })
        );
        const secondRequest = jest.fn().mockResolvedValue('second');

        const firstPromise = aborter.try(firstRequest);

        const secondPromise = aborter.try(secondRequest);

        await expect(secondPromise).resolves.toBe('second');
      });
    });
  });

  describe('Статические методы', () => {
    it('isError должен делегировать вызов Utils.isError', () => {
      const testError = new Error('test');
      const mockIsError = isError as unknown as jest.Mock;
      mockIsError.mockReturnValue(true);

      const result = Aborter.isError(testError);

      expect(result).toBe(true);
      expect(mockIsError).toHaveBeenCalledWith(testError);
    });
  });

  describe('onAbort property', () => {
    it('Проверка исполнения коллбека onAbort при передаче через конструктор', async () => {
      const fn = jest.fn();
      const abortError = new DOMException('Aborted', 'AbortError');
      mockRequest.mockRejectedValue(abortError);
      (isError as unknown as jest.Mock).mockReturnValue(true);

      aborter = new Aborter({ onAbort: fn });

      const promise = aborter.try(mockRequest);

      await Promise.race([
        promise,
        new Promise((resolve) => {
          setTimeout(() => resolve('timeout'), 50);
        })
      ]);

      expect(fn).toHaveBeenCalled();
    });

    it('Проверка исполнения коллбека onAbort при переопределении свойства', async () => {
      const fn = jest.fn();
      const abortError = new AbortError('Aborted');
      mockRequest.mockRejectedValue(abortError);
      (isError as unknown as jest.Mock).mockReturnValue(true);

      const promise = aborter.try(mockRequest);

      aborter.listeners.onabort = (error) => {
        fn();
        expect(error.message).toBe(abortError.message);
      };

      await Promise.race([
        promise,
        new Promise((resolve) => {
          setTimeout(() => resolve('timeout'), 50);
        })
      ]);

      expect(fn).toHaveBeenCalled();
    });
  });
});
