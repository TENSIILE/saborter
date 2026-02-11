/* eslint-disable dot-notation */
import { Aborter } from './aborter';
import { AbortError } from '../../features/abort-error';
import { EventListener } from '../../features/event-listener';
import { emitMethodSymbol } from '../../features/state-observer/state-observer.constants';
import { ErrorMessage } from './aborter.constants';

describe('Aborter', () => {
  let aborter: Aborter;
  let mockRequest: jest.Mock;
  let mockSignal: AbortSignal;

  beforeEach(() => {
    jest.clearAllMocks();

    aborter = new Aborter();
    mockRequest = jest.fn();

    mockSignal = {
      aborted: false,
      reason: undefined,
      onabort: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      throwIfAborted: jest.fn()
    } as unknown as AbortSignal;

    global.AbortController = jest.fn().mockImplementation(() => ({
      abort: jest.fn(),
      signal: mockSignal
    }));

    global.queueMicrotask = jest.fn().mockImplementation((callback) => callback());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Конструктор', () => {
    it('должен создавать экземпляр Aborter', () => {
      expect(aborter).toBeInstanceOf(Aborter);
      expect(aborter.listeners).toBeInstanceOf(EventListener);
    });
  });

  describe('Метод try', () => {
    it('должен выполнять запрос и возвращать результат', async () => {
      const expectedResult = { data: 'test' };
      mockRequest.mockResolvedValue(expectedResult);

      const result = await aborter.try(mockRequest);

      expect(mockRequest).toHaveBeenCalledWith(mockSignal);
      expect(result).toEqual(expectedResult);
    });

    it('должен отменять предыдущий запрос при новом вызове', async () => {
      const slowRequest = jest.fn().mockImplementation(() => new Promise(() => {}));
      const fastRequest = jest.fn().mockResolvedValue('fast');

      const slowPromise = aborter.try(slowRequest);

      const fastPromise = aborter.try(fastRequest);

      await expect(fastPromise).resolves.toBe('fast');
    });

    it('должен поймать ошибку отмены к блоке catch при флаге isErrorNativeBehavior', async () => {
      const slowRequest = jest.fn().mockImplementation(() => new Promise(() => {}));
      const fastRequest = jest.fn().mockResolvedValue('fast');

      try {
        const slowPromise = aborter.try(slowRequest, { isErrorNativeBehavior: true });
        const fastPromise = aborter.try(fastRequest, { isErrorNativeBehavior: true });

        await expect(fastPromise).resolves.toBe('fast');
      } catch (error) {
        expect(error instanceof AbortError ? error.type : '').toBe('cancelled');
      }
    });

    it('должен обрабатывать AbortError c отклонением промиса', async () => {
      const abortError = new AbortError('Aborted');
      mockRequest.mockRejectedValue(abortError);

      const promise = aborter.try(mockRequest);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100);
      });

      await expect(Promise.race([promise, timeoutPromise])).rejects.toThrow('Aborted');
    });

    it('должен устанавливать таймаут', async () => {
      const timeoutMock = {
        setTimeout: jest.fn(),
        clearTimeout: jest.fn()
      };

      aborter['timeout'] = timeoutMock as any;

      const timeoutOptions = { ms: 5000 };
      mockRequest.mockResolvedValue('result');

      await aborter.try(mockRequest, { timeout: timeoutOptions });

      expect(timeoutMock.setTimeout).toHaveBeenCalledWith(5000, expect.any(Function));
    });
  });

  describe('Метод abort', () => {
    it('должен прерывать текущий запрос', () => {
      const abortSpy = jest.spyOn(aborter['abortController']!, 'abort');
      aborter['isRequestInProgress'] = true;

      aborter.abort('test reason');

      const abortError = new AbortError(ErrorMessage.AbortedSignalWithoutMessage, {
        reason: 'test reason',
        initiator: 'user',
        type: 'aborted'
      });

      expect(abortSpy).toHaveBeenCalledWith(abortError);
      expect(aborter['isRequestInProgress']).toBe(false);
    });

    it('должен очищать таймаут при прерывании', () => {
      const timeoutMock = {
        clearTimeout: jest.fn()
      };

      aborter['timeout'] = timeoutMock as any;
      aborter['isRequestInProgress'] = true;

      aborter.abort();

      expect(timeoutMock.clearTimeout).toHaveBeenCalled();
    });

    it('Вызов коллбека onAbort при прерывании запроса', async () => {
      const firstRequest = jest.fn().mockImplementation(() => new Promise(() => {}));
      const secondRequest = jest.fn().mockResolvedValue('second');

      const fn = jest.fn();

      const aborterInstance = new Aborter({ onAbort: fn });

      const firstPromise = aborterInstance.try(firstRequest);
      const secondPromise = aborterInstance.try(secondRequest);

      expect(fn).toHaveBeenCalled();
      await expect(secondPromise).resolves.toBe('second');
    });
  });

  describe('Метод abortWithRecovery', () => {
    it('должен прерывать текущий запрос и создавать новый контроллер', () => {
      const originalController = aborter['abortController'];
      const abortSpy = jest.spyOn(aborter, 'abort');

      const newController = aborter.abortWithRecovery('reason');

      expect(abortSpy).toHaveBeenCalledWith('reason');
      expect(aborter['abortController']).toBe(newController);
      expect(aborter['abortController']).not.toBe(originalController);
    });
  });

  describe('Состояния и события', () => {
    it('должен излучать состояние pending при начале запроса', async () => {
      const emitSpy = jest.spyOn(aborter.listeners.state, emitMethodSymbol);

      mockRequest.mockResolvedValue('result');

      await aborter.try(mockRequest);

      expect(emitSpy).toHaveBeenCalledWith('pending');
    });

    it('должен излучать состояние fulfilled при успешном завершении', async () => {
      const emitSpy = jest.spyOn(aborter.listeners.state, emitMethodSymbol);

      mockRequest.mockResolvedValue('result');

      await aborter.try(mockRequest);

      expect(emitSpy).toHaveBeenCalledWith('fulfilled');
    });

    it('должен излучать состояние rejected при ошибке', async () => {
      const emitSpy = jest.spyOn(aborter.listeners.state, emitMethodSymbol);

      mockRequest.mockRejectedValue(new Error('test'));

      try {
        await aborter.try(mockRequest);
      } catch {
        // Игнорируем ошибку
      }

      expect(emitSpy).toHaveBeenCalledWith('rejected');
    });

    it('должен излучать состояние cancelled при отмене предыдущего запроса', async () => {
      const slowRequest = () => new Promise(() => {});
      const fastRequest = jest.fn().mockResolvedValue('fast');

      const emitSpy = jest.spyOn(aborter.listeners.state, emitMethodSymbol);

      const dispatchSpy = jest.spyOn(aborter.listeners, 'dispatchEvent');

      aborter.try(slowRequest);
      await aborter.try(fastRequest);

      expect(emitSpy).toHaveBeenCalledWith('cancelled');
      expect(dispatchSpy).toHaveBeenCalledWith('cancelled', expect.any(AbortError));
    });
  });

  describe('Поведение при повторных вызовах', () => {
    it('должен корректно обрабатывать несколько последовательных запросов', async () => {
      const results = ['result1', 'result2', 'result3'];
      let callCount = 0;

      // eslint-disable-next-line no-plusplus
      mockRequest.mockImplementation(() => Promise.resolve(results[callCount++]));

      // eslint-disable-next-line no-restricted-syntax
      for (const expectedResult of results) {
        // eslint-disable-next-line no-await-in-loop
        const result = await aborter.try(mockRequest);
        expect(result).toBe(expectedResult);
      }
    });

    it('не должен позволять множественные одновременные запросы', async () => {
      const requestPromises: Promise<unknown>[] = [];

      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < 3; i++) {
        requestPromises.push(aborter.try(() => new Promise(() => {})));
      }

      expect(aborter['isRequestInProgress']).toBe(true);
    });
  });
});
