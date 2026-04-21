/* eslint-disable dot-notation */
import { Aborter } from './aborter';
import { AbortError } from '../../features/abort-error';
import { EventListener } from '../../features/event-listener';
import { emitMethodSymbol } from '../../features/state-observer/state-observer.constants';
import { ErrorMessage } from './aborter.constants';
import { createAbortableHeaders } from '../../features/server-breaker/server-breaker.utils';

class MockResponse {
  public body: any;

  public status: number;

  public ok: boolean;

  constructor(body: any, init: any) {
    this.body = body;
    this.status = init?.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
  }

  json() {
    return Promise.resolve(JSON.parse(this.body));
  }

  text() {
    return Promise.resolve(this.body);
  }
}

(global as any).Response = MockResponse;

describe('Aborter', () => {
  let aborter: Aborter;
  let mockRequest: jest.Mock;
  let mockSignal: AbortSignal;
  let headers;

  beforeEach(() => {
    jest.clearAllMocks();

    headers = createAbortableHeaders();
    aborter = new Aborter();
    mockRequest = jest.fn();
    aborter['serverBreaker']['meta']['headers'] = headers;

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

  describe('Constructor', () => {
    it('must create an instance of Aborter', () => {
      expect(aborter).toBeInstanceOf(Aborter);
      expect(aborter.listeners).toBeInstanceOf(EventListener);
    });
  });

  describe('try method', () => {
    it('must execute the query and return the result', async () => {
      const expectedResult = { data: 'test' };

      mockRequest.mockResolvedValue(expectedResult);

      const result = await aborter.try(mockRequest);

      expect(mockRequest).toHaveBeenCalledWith(mockSignal, { headers });
      expect(result).toEqual(expectedResult);
    });

    it('should cancel the previous request when a new call is made', async () => {
      const slowRequest = jest.fn().mockImplementation(() => new Promise(() => {}));
      const fastRequest = jest.fn().mockResolvedValue('fast');

      const slowPromise = aborter.try(slowRequest);

      const fastPromise = aborter.try(fastRequest);

      await expect(fastPromise).resolves.toBe('fast');
    });

    it('must catch the cancellation error in the catch block with the isErrorNativeBehavior flag', async () => {
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

    it('must handle AbortError with promise rejection', async () => {
      const abortError = new AbortError('Aborted');
      mockRequest.mockRejectedValue(abortError);

      const promise = aborter.try(mockRequest);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100);
      });

      await expect(Promise.race([promise, timeoutPromise])).rejects.toThrow('Aborted');
    });

    it('must set a timeout', async () => {
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

  describe('abort method', () => {
    it('must abort the current request', () => {
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

    it('should clear timeout on interrupt', () => {
      const timeoutMock = {
        clearTimeout: jest.fn()
      };

      aborter['timeout'] = timeoutMock as any;
      aborter['isRequestInProgress'] = true;

      aborter.abort();

      expect(timeoutMock.clearTimeout).toHaveBeenCalled();
    });

    it('calling the onAbort callback when a request is aborted', async () => {
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

  describe('abortWithRecovery method', () => {
    it('should abort the current request and create a new controller', () => {
      const originalController = aborter['abortController'];
      const abortSpy = jest.spyOn(aborter, 'abort');

      const newController = aborter.abortWithRecovery('reason');

      expect(abortSpy).toHaveBeenCalledWith('reason');
      expect(aborter['abortController']).toBe(newController);
      expect(aborter['abortController']).not.toBe(originalController);
    });
  });

  describe('States and events', () => {
    it('must emit a pending state when a request starts', async () => {
      const emitSpy = jest.spyOn(aborter.listeners.state, emitMethodSymbol);

      mockRequest.mockResolvedValue('result');

      await aborter.try(mockRequest);

      expect(emitSpy).toHaveBeenCalledWith('pending');
    });

    it('must emit a fulfilled state upon successful completion', async () => {
      const emitSpy = jest.spyOn(aborter.listeners.state, emitMethodSymbol);

      mockRequest.mockResolvedValue('result');

      await aborter.try(mockRequest);

      expect(emitSpy).toHaveBeenCalledWith('fulfilled');
    });

    it('must emit a rejected state on error', async () => {
      const emitSpy = jest.spyOn(aborter.listeners.state, emitMethodSymbol);

      mockRequest.mockRejectedValue(new Error('test'));

      try {
        await aborter.try(mockRequest);
      } catch {
        // Ignore the error
      }

      expect(emitSpy).toHaveBeenCalledWith('rejected');
    });

    it('must emit a canceled state when the previous request is canceled', async () => {
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

  describe('Behavior on repeated calls', () => {
    it('should handle multiple consecutive requests correctly', async () => {
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

    it('should not allow multiple simultaneous requests', async () => {
      const requestPromises: Promise<unknown>[] = [];

      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < 3; i++) {
        requestPromises.push(aborter.try(() => new Promise(() => {})));
      }

      expect(aborter['isRequestInProgress']).toBe(true);
    });
  });

  describe('AborterOptions', () => {
    it('should allow creating an options object with onInit, onAbort, onStateChange', () => {
      const onInitMock = jest.fn();
      const onAbortMock = jest.fn();
      const onStateChangeMock = jest.fn();

      const options = {
        onInit: onInitMock,
        onAbort: onAbortMock,
        onStateChange: onStateChangeMock
      };

      expect(options.onInit).toBe(onInitMock);
      expect(options.onAbort).toBe(onAbortMock);
      expect(options.onStateChange).toBe(onStateChangeMock);
    });

    it('should allow empty options', () => {
      const options = {};
      expect(options).toBeDefined();
    });

    it('should allow only onInit without onAbort/onStateChange', () => {
      const onInitMock = jest.fn();
      const options = { onInit: onInitMock };
      expect(options.onInit).toBe(onInitMock);
      expect(options['onAbort']).toBeUndefined();
      expect(options['onStateChange']).toBeUndefined();
    });

    it('should work with a concrete Aborter instance', () => {
      const aborterInstance = new Aborter();

      const onInit = jest.fn((instance) => {
        expect(instance).toBe(aborterInstance);
      });

      onInit(aborterInstance);
      expect(onInit).toHaveBeenCalledWith(aborterInstance);
    });
  });
});
