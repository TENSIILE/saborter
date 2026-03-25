import { FetcherFactory } from './fetcher-factory';
import { defaultFetcher } from './fetcher-factory.lib';
import { overrideSymbol } from './fetcher-factory.constants';
import { Utils } from '../../shared';

jest.mock('../../shared', () => ({
  Utils: {
    generateUuid: jest.fn().mockReturnValue('mock-uuid')
  }
}));

jest.mock('./fetcher-factory.lib', () => ({
  defaultFetcher: jest.fn()
}));

jest.mock('./fetcher-factory.constants', () => ({
  overrideSymbol: Symbol('override')
}));

describe('FetcherFactory', () => {
  let mockSignal: AbortSignal;
  let mockController: AbortController;
  let originalWindow: any;
  let originalNavigator: any;

  beforeAll(() => {
    originalWindow = global.window;
    originalNavigator = global.navigator;
  });

  afterAll(() => {
    global.window = originalWindow;
    global.navigator = originalNavigator;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockController = new AbortController();
    mockSignal = mockController.signal;

    delete (global as any).window;
    delete (global as any).navigator;
  });

  describe('конструктор', () => {
    it('должен использовать defaultFetcher, если fetcher не передан', () => {
      const factory = new FetcherFactory({ signal: mockSignal });
      expect(factory['fetcherFactory']).toBe(defaultFetcher);
    });

    it('должен сохранять переданный fetcher', () => {
      const customFetcher = jest.fn();
      const factory = new FetcherFactory({ fetcher: customFetcher, signal: mockSignal });
      expect(factory['fetcherFactory']).toBe(customFetcher);
    });

    it('должен сохранять переданный сигнал', () => {
      const factory = new FetcherFactory({ signal: mockSignal });
      expect(factory['signal']).toBe(mockSignal);
    });

    it('должен устанавливать interruptionsOnServer с дефолтными значениями, если options.interruptionsOnServer не передан', () => {
      const factory = new FetcherFactory({ signal: mockSignal });
      expect(factory['interruptionsOnServer']).not.toHaveProperty('hasInterruptRequests');
    });
  });

  describe('метод createHeaders', () => {
    it('должен генерировать уникальный x-request-id', () => {
      const factory = new FetcherFactory({ signal: mockSignal });
      const headers = factory['createHeaders']();
      expect(Utils.generateUuid).toHaveBeenCalled();
      expect(headers['x-request-id']).toBe('mock-uuid');
    });

    it('должен устанавливать Cache-Control и Pragma', () => {
      const factory = new FetcherFactory({ signal: mockSignal });
      const headers = factory['createHeaders']();
      expect(headers['Cache-Control']).toBe('no-cache');
      expect(headers.Pragma).toBe('no-cache');
    });
  });

  describe('метод createContext', () => {
    it('должен вызывать createHeaders и сохранять их в meta.headers', () => {
      const factory = new FetcherFactory({ signal: mockSignal });
      const createHeadersSpy = jest.spyOn(factory as any, 'createHeaders');
      const context = factory['createContext']();

      expect(createHeadersSpy).toHaveBeenCalled();
      expect(factory['meta'].headers).toBeDefined();
      expect(context.headers).toBe(factory['meta'].headers);
    });

    it('должен возвращать объект с save, headers и signal', () => {
      const factory = new FetcherFactory({ signal: mockSignal });
      const context = factory['createContext']();

      expect(context).toHaveProperty('save');
      expect(typeof context.save).toBe('function');
      expect(context.headers).toBeDefined();
      expect(context.signal).toBe(mockSignal);
    });

    it('метод save должен сохранять данные в meta.url', () => {
      const factory = new FetcherFactory({ signal: mockSignal });
      const context = factory['createContext']();
      const testUrl = 'https://';
      context.save({ url: testUrl, method: 'post' });
      expect(factory['meta'].url).toBe(testUrl);
    });
  });

  describe('метод setAbortSignal', () => {
    it('должен обновлять сигнал', () => {
      const factory = new FetcherFactory({ signal: mockSignal });
      const newController = new AbortController();
      const newSignal = newController.signal;
      factory.setAbortSignal(newSignal);
      expect(factory['signal']).toBe(newSignal);
    });
  });

  describe('геттер fetcher', () => {
    let factory: FetcherFactory;
    let mockContext: any;

    beforeEach(() => {
      factory = new FetcherFactory({ signal: mockSignal });
      mockContext = {
        headers: { 'x-request-id': 'uuid' },
        signal: mockSignal,
        save: jest.fn()
      };
      jest.spyOn(factory as any, 'createContext').mockReturnValue(mockContext);
    });

    it('должен возвращать функцию, которая вызывает fetcherFactory с переданными аргументами, если нет overrideSymbol', () => {
      const mockFetcher = jest.fn().mockReturnValue(jest.fn());
      factory['fetcherFactory'] = mockFetcher;
      delete factory['fetcherFactory'][overrideSymbol];

      // eslint-disable-next-line prefer-destructuring
      const fetcher = factory.fetcher;
      expect(typeof fetcher).toBe('function');

      fetcher('/api/test', { method: 'GET' });
      expect(mockFetcher).toHaveBeenCalledWith('/api/test', { method: 'GET' });
      const returnedFn = mockFetcher.mock.results[0].value;
      expect(returnedFn).toHaveBeenCalledWith(mockContext);
    });

    it('должен возвращать результат вызова fetcherFactory([]) с контекстом, если есть overrideSymbol', () => {
      const mockFactoryReturn = jest.fn().mockReturnValue(jest.fn());
      const mockFetcherFactory = jest.fn().mockReturnValue(mockFactoryReturn);
      factory['fetcherFactory'] = mockFetcherFactory;
      factory['fetcherFactory'][overrideSymbol] = overrideSymbol;

      // eslint-disable-next-line prefer-destructuring
      const fetcher = factory.fetcher;
      expect(typeof fetcher).toBe('function');

      fetcher('/api/test', { method: 'GET' });

      expect(mockFetcherFactory).toHaveBeenCalledWith([]);
      expect(mockFactoryReturn).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('метод notifyServerOfInterruption', () => {
    let factory: FetcherFactory;
    let sendBeaconMock: jest.Mock;
    let fetchMock: jest.Mock;

    beforeEach(() => {
      factory = new FetcherFactory({ signal: mockSignal });
      factory['interruptionsOnServer'] = {
        hasInterruptRequests: true,
        endpointName: '/api/cancel',
        basePath: 'https://example.com'
      };
      factory['meta'].headers = { 'x-request-id': 'test-uuid', 'Cache-Control': 'no-cache', Pragma: 'no-cache' };

      sendBeaconMock = jest.fn().mockReturnValue(true);
      fetchMock = jest.fn().mockResolvedValue({} as Response);
      global.fetch = fetchMock;
      global.navigator = { sendBeacon: sendBeaconMock } as any;
    });

    afterEach(() => {
      delete (global as any).fetch;
      delete (global as any).navigator;
    });

    it('не должен отправлять запрос, если hasInterruptRequests = false', () => {
      if (factory['interruptionsOnServer']) {
        factory['interruptionsOnServer'].hasInterruptRequests = false;
      }
      factory.notifyServerOfInterruption();
      expect(sendBeaconMock).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('должен использовать navigator.sendBeacon, если доступен', () => {
      factory.notifyServerOfInterruption();
      expect(sendBeaconMock).toHaveBeenCalledWith('https://example.com/api/cancel', expect.any(Blob));
      const blobArg = sendBeaconMock.mock.calls[0][1];
      expect(blobArg.type).toBe('text/plain');
      expect(blobArg).toBeInstanceOf(Blob);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('должен использовать fetch, если sendBeacon недоступен', async () => {
      delete (global.navigator as any).sendBeacon;
      factory.notifyServerOfInterruption();
      expect(fetchMock).toHaveBeenCalledWith('https://example.com/api/cancel', {
        method: 'POST',
        body: expect.any(Blob)
      });
      const blobArg = fetchMock.mock.calls[0][1].body;
      expect(blobArg).toBeInstanceOf(Blob);
    });

    it('должен использовать пустую строку, если x-request-id отсутствует', () => {
      Reflect.deleteProperty(factory['meta'].headers ?? {}, 'x-request-id');

      factory.notifyServerOfInterruption();
      expect(sendBeaconMock).toHaveBeenCalledWith('https://example.com/api/cancel', expect.any(Blob));
      const blobArg = sendBeaconMock.mock.calls[0][1];
      expect(blobArg).toBeInstanceOf(Blob);
    });
  });
});
