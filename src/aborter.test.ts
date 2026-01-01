import { rejects } from 'assert';
import { Aborter } from './aborter';
import * as Utils from './utils';

jest.mock('./utils', () => ({
  isError: jest.fn(),
  get: jest.fn(),
}));

describe('Aborter', () => {
  let aborter: Aborter;
  let mockRequest: jest.Mock;
  let mockAbortController: {
    abort: jest.Mock;
    signal: AbortSignal;
  };

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
        throwIfAborted: jest.fn(),
      } as unknown as AbortSignal,
    })) as any;

    aborter = new Aborter();
    mockRequest = jest.fn();
    mockAbortController = (aborter as any).abortController;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('должен создавать новый экземпляр Aborter с AbortController', () => {
      expect(aborter).toBeInstanceOf(Aborter);
      expect(global.AbortController).toHaveBeenCalledTimes(1);
    });
  });

  describe('signal', () => {
    it('должен возвращать signal от внутреннего AbortController', () => {
      const signal = aborter.signal;
      expect(signal).toBe(mockAbortController.signal);
    });
  });

  describe('abort', () => {
    it('должен вызывать abort на внутреннем AbortController', () => {
      aborter.abort();
      expect(mockAbortController.abort).toHaveBeenCalledTimes(1);
    });

    it('должен вызывать abort перед созданием нового запроса в методе try', async () => {
      mockRequest.mockResolvedValue('success');

      await aborter.try(mockRequest);

      expect(mockAbortController.abort).toHaveBeenCalledTimes(1);
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
      it('должен использовать cause.message если основное сообщение отсутствует', async () => {
        const error = {
          cause: { message: 'Cause error message' },
        };
        mockRequest.mockRejectedValue(error);
        (Utils.isError as unknown as jest.Mock).mockReturnValue(false);
        (Utils.get as jest.Mock).mockReturnValue('Cause error message');

        await expect(aborter.try(mockRequest)).rejects.toEqual({
          ...error,
          message: 'Cause error message',
        });
      });

      it('должен возвращать пустую строку если нет сообщения об ошибке', async () => {
        const error = {};
        mockRequest.mockRejectedValue(error);
        (Utils.isError as unknown as jest.Mock).mockReturnValue(false);
        (Utils.get as jest.Mock).mockReturnValue(undefined);

        await expect(aborter.try(mockRequest)).rejects.toEqual({
          ...error,
          message: '',
        });
      });

      it('должен отменять предыдущий запрос при новом вызове try', async () => {
        const firstRequest = jest
          .fn()
          .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve('first'), 100)));
        const secondRequest = jest.fn().mockResolvedValue('second');

        const firstPromise = aborter.try(firstRequest);

        const secondPromise = aborter.try(secondRequest);

        await expect(secondPromise).resolves.toBe('second');

        expect(mockAbortController.abort).toHaveBeenCalled();
      });

      it('не должен завершать промис при AbortError и isErrorNativeBehavior = false', async () => {
        const abortError = new DOMException('Aborted', 'AbortError');
        mockRequest.mockRejectedValue(abortError);
        (Utils.isError as unknown as jest.Mock).mockReturnValue(true);

        const promise = aborter.try(mockRequest);

        await Promise.race([promise, new Promise(resolve => setTimeout(() => resolve('timeout'), 50))]);

        expect(mockAbortController.abort).toHaveBeenCalled();
      });
    });
  });

  describe('Статические методы', () => {
    it('isError должен делегировать вызов Utils.isError', () => {
      const testError = new Error('test');
      const mockIsError = Utils.isError as unknown as jest.Mock;
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
      (Utils.isError as unknown as jest.Mock).mockReturnValue(true);

      aborter = new Aborter({ onAbort: fn });
      mockAbortController = (aborter as any).abortController;

      const promise = aborter.try(mockRequest);

      await Promise.race([promise, new Promise(resolve => setTimeout(() => resolve('timeout'), 50))]);

      expect(mockAbortController.abort).toHaveBeenCalled();
      expect(fn).toHaveBeenCalled();
    });

    it('Проверка исполнения коллбека onAbort при переопределении свойства', async () => {
      const fn = jest.fn();
      const abortError = new DOMException('Aborted', 'AbortError');
      mockRequest.mockRejectedValue(abortError);
      (Utils.isError as unknown as jest.Mock).mockReturnValue(true);

      const promise = aborter.try(mockRequest);

      aborter.onAbort = error => {
        fn();
        expect(error.message).toBe(abortError.message);
      };

      await Promise.race([promise, new Promise(resolve => setTimeout(() => resolve('timeout'), 50))]);

      expect(mockAbortController.abort).toHaveBeenCalled();
      expect(fn).toHaveBeenCalled();
    });
  });
});
