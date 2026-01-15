import { Aborter } from './aborter';
import { EventListener } from './event-listener';
import { Timeout, TimeoutError } from '../../features/timeout';
import { AbortError } from '../../features/abort-error/abort-error';
import { getCauseMessage, isError } from '../../features/abort-error/abort-error.lib';

jest.mock('./event-listener', () => {
  return {
    EventListener: jest.fn().mockImplementation(() => ({
      dispatchEvent: jest.fn()
    }))
  };
});

jest.mock('../../features/timeout', () => {
  return {
    Timeout: jest.fn().mockImplementation(() => ({
      setTimeout: jest.fn(),
      clearTimeout: jest.fn()
    })),
    TimeoutError: jest.fn().mockImplementation((message, timeout) => ({
      name: 'TimeoutError',
      message,
      timeout,
      hasThrow: timeout?.hasThrow || false
    }))
  };
});

jest.mock('../../features/abort-error/abort-error', () => {
  return {
    AbortError: jest.fn().mockImplementation((message, options) => ({
      name: 'AbortError',
      message,
      ...options,
      type: options?.type
    }))
  };
});

jest.mock('../../features/abort-error/abort-error.lib', () => ({
  getCauseMessage: jest.fn().mockReturnValue(''),
  isError: jest.fn().mockReturnValue(false)
}));

const mockAbortController = {
  signal: {} as AbortSignal,
  abort: jest.fn()
};

describe('Aborter', () => {
  let aborter: Aborter;
  let mockEventListenerInstance: { dispatchEvent: jest.Mock };
  let mockTimeoutInstance: { setTimeout: jest.Mock; clearTimeout: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    global.AbortController = jest.fn(() => mockAbortController) as any;

    mockEventListenerInstance = {
      dispatchEvent: jest.fn()
    };
    mockTimeoutInstance = {
      setTimeout: jest.fn(),
      clearTimeout: jest.fn()
    };

    (EventListener as jest.Mock).mockImplementation(() => mockEventListenerInstance);
    (Timeout as jest.Mock).mockImplementation(() => mockTimeoutInstance);

    (isError as any).mockImplementation(() => jest.fn());

    aborter = new Aborter();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with empty pendingRequests map', () => {
      expect((aborter as any).pendingRequests.size).toBe(0);
    });

    it('should create EventListener with provided options', () => {
      const mockOnAbort = jest.fn();
      const options = { onAbort: mockOnAbort };

      // eslint-disable-next-line no-new
      new Aborter(options);

      expect(EventListener).toHaveBeenCalledWith({ onAbort: mockOnAbort });
    });
  });

  describe('try method', () => {
    const mockRequestName = 'testRequest';

    beforeEach(() => {
      mockAbortController.abort.mockClear();
      mockEventListenerInstance.dispatchEvent.mockClear();
    });

    it('should abort previous request with same name', async () => {
      const firstRequest = jest.fn().mockResolvedValue('first');
      const secondRequest = jest.fn().mockResolvedValue('second');

      const firstPromise = aborter.try(firstRequest, { name: mockRequestName });

      const secondPromise = aborter.try(secondRequest, { name: mockRequestName });

      await Promise.allSettled([firstPromise, secondPromise]);

      expect(mockAbortController.abort).toHaveBeenCalled();
      expect(mockEventListenerInstance.dispatchEvent).toHaveBeenCalledWith(
        'cancelled',
        expect.objectContaining({ type: 'cancelled' })
      );
    });

    it('should handle successful request', async () => {
      const response = { data: 'test' };
      const mockRequest = jest.fn().mockResolvedValue(response);

      const result = await aborter.try(mockRequest, { name: mockRequestName });

      expect(result).toBe(response);
      expect((aborter as any).pendingRequests.size).toBe(0);
    });

    it('should handle request error with native behavior', async () => {
      const error = new Error('Request failed');
      const mockRequest = jest.fn().mockRejectedValue(error);

      await expect(aborter.try(mockRequest, { name: mockRequestName, isErrorNativeBehavior: true })).rejects.toThrow(
        'Request failed'
      );
    });

    it('should handle timeout correctly', () => {
      const timeoutMs = 1000;
      const mockRequest = jest.fn().mockResolvedValue('data');

      aborter.try(mockRequest, {
        name: mockRequestName,
        timeout: { ms: timeoutMs }
      });

      expect(mockTimeoutInstance.setTimeout).toHaveBeenCalledWith(timeoutMs, expect.any(Function));
    });
  });

  describe('abortByRequestName method', () => {
    it('should abort specific request and clear timeout', () => {
      (aborter as any).pendingRequests.set('test', {
        controller: mockAbortController,
        timeout: mockTimeoutInstance
      });

      (aborter as any).abortByRequestName('test', {
        reason: new Error('Manual abort')
      });

      expect(mockTimeoutInstance.clearTimeout).toHaveBeenCalled();
      expect(mockAbortController.abort).toHaveBeenCalledWith(expect.any(Error));
      expect((aborter as any).pendingRequests.has('test')).toBe(false);
    });

    it('should do nothing if request not found', () => {
      expect(() => {
        (aborter as any).abortByRequestName('non-existent');
      }).not.toThrow();
    });
  });

  describe('abort method', () => {
    it('should abort all requests when no name specified', () => {
      const mockController1 = { abort: jest.fn() };
      const mockController2 = { abort: jest.fn() };
      const mockTimeout1 = { clearTimeout: jest.fn() };
      const mockTimeout2 = { clearTimeout: jest.fn() };

      (aborter as any).pendingRequests.set('req1', {
        controller: mockController1,
        timeout: mockTimeout1
      });

      (aborter as any).pendingRequests.set('req2', {
        controller: mockController2,
        timeout: mockTimeout2
      });

      aborter.abort();

      expect(mockTimeout1.clearTimeout).toHaveBeenCalled();
      expect(mockTimeout2.clearTimeout).toHaveBeenCalled();
      expect(mockController1.abort).toHaveBeenCalled();
      expect(mockController2.abort).toHaveBeenCalled();
      expect((aborter as any).pendingRequests.size).toBe(0);
    });

    it('should abort single request by name', () => {
      const abortSpy = jest.spyOn(aborter as any, 'abortByRequestName');

      aborter.abort({ abortByName: 'specific-request' });

      expect(abortSpy).toHaveBeenCalledWith('specific-request', {
        reason: undefined
      });
    });

    it('should abort multiple requests by array of names', () => {
      const abortSpy = jest.spyOn(aborter as any, 'abortByRequestName');
      const names = ['req1', 'req2', 'req3'];

      aborter.abort({ abortByName: names });

      expect(abortSpy).toHaveBeenCalledTimes(3);
      names.forEach((name) => {
        expect(abortSpy).toHaveBeenCalledWith(name, {
          reason: undefined
        });
      });
    });
  });
});

describe('Aborter Integration', () => {
  let originalAbortController: typeof AbortController;

  beforeAll(() => {
    originalAbortController = global.AbortController;
  });

  afterAll(() => {
    global.AbortController = originalAbortController;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should work with real fetch requests', async () => {
    // eslint-disable-next-line global-require
    const { Aborter: Saborter } = require('./aborter');
    const aborter = new Saborter();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' })
    });

    const fetchRequest = (signal: AbortSignal) =>
      fetch('https://jsonplaceholder.typicode.com/todos', { signal }).then((response) => response.json());

    const result = await aborter.try(fetchRequest, {
      name: 'fetchRequest'
    });

    expect(result).toEqual({ data: 'test' });
  });
});
