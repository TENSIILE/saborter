import { ServerBreaker } from './server-breaker';
import { createHeaders } from './server-breaker.utils';

jest.mock('./server-breaker.utils', () => ({
  createHeaders: jest.fn().mockReturnValue({ 'x-request-id': 'test-uuid' })
}));

describe('ServerBreaker', () => {
  let originalWindow;
  let originalNavigator;

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

    Reflect.deleteProperty(global, 'window');
    Reflect.deleteProperty(global, 'navigator');
  });

  describe('setInterruptionsOnServer', () => {
    it('should set interruptionsOnServer with default values ​​if true is passed', () => {
      const breaker = new ServerBreaker({ interruptionsOnServer: true });
      expect(breaker['interruptionsOnServer']).toEqual(
        expect.objectContaining({
          endpointName: '/api/cancel'
        })
      );
      expect(createHeaders).toHaveBeenCalled();
    });

    it('must use the passed interruptionsOnServer object', () => {
      const customConfig = {
        baseURL: 'https://custom.com',
        endpointName: '/custom/cancel'
      };
      const breaker = new ServerBreaker({ interruptionsOnServer: customConfig });
      expect(breaker['interruptionsOnServer']).toEqual(customConfig);
      expect(createHeaders).toHaveBeenCalled();
    });

    it('should ignore interruptionsOnServer if false is passed', () => {
      const breaker = new ServerBreaker({ interruptionsOnServer: false });
      expect(breaker['interruptionsOnServer']).toBeUndefined();
      expect(createHeaders).not.toHaveBeenCalled();
    });

    it('should ignore interruptionsOnServer if undefined is passed', () => {
      const breaker = new ServerBreaker({ interruptionsOnServer: undefined });
      expect(breaker['interruptionsOnServer']).toBeUndefined();
      expect(createHeaders).not.toHaveBeenCalled();
    });
  });

  describe('getter headers', () => {
    it('should return headers from meta.headers if interruptionsOnServer is set', () => {
      const breaker = new ServerBreaker({ interruptionsOnServer: true });
      expect(breaker.headers).toEqual({ 'x-request-id': 'test-uuid' });
    });

    it('should return undefined if interruptionsOnServer is not set', () => {
      const breaker = new ServerBreaker();
      expect(breaker.headers).toBeUndefined();
    });
  });

  describe('notifyServerOfInterruption', () => {
    let breaker;
    let sendBeaconMock;
    let fetchMock;

    beforeEach(() => {
      breaker = new ServerBreaker({ interruptionsOnServer: true });
      sendBeaconMock = jest.fn().mockReturnValue(true);
      fetchMock = jest.fn().mockResolvedValue({});
      global.fetch = fetchMock;
    });

    afterEach(() => {
      Reflect.deleteProperty(global, 'fetch');
    });

    it('should not send a request if interruptionsOnServer is not present', () => {
      const breakerWithout = new ServerBreaker();
      breakerWithout.notifyServerOfInterruption();
      expect(sendBeaconMock).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should use navigator.sendBeacon if available', () => {
      global.navigator = { sendBeacon: sendBeaconMock } as any;
      breaker = new ServerBreaker({ interruptionsOnServer: { baseURL: 'https://example.com' } });
      breaker.notifyServerOfInterruption();
      expect(sendBeaconMock).toHaveBeenCalledWith('https://example.com/api/cancel', expect.any(Blob));
      const blobArg = sendBeaconMock.mock.calls[0][1];
      expect(blobArg.type).toBe('text/plain');
      expect(blobArg).toBeInstanceOf(Blob);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should use fetch if sendBeacon is not available', () => {
      global.navigator = {} as any;
      breaker = new ServerBreaker({ interruptionsOnServer: { baseURL: 'https://example.com' } });
      breaker.notifyServerOfInterruption();
      expect(fetchMock).toHaveBeenCalledWith('https://example.com/api/cancel', {
        method: 'POST',
        body: expect.any(Blob)
      });
      const blobArg = fetchMock.mock.calls[0][1].body;
      expect(blobArg).toBeInstanceOf(Blob);
    });

    it('should use an empty string if x-request-id is missing', () => {
      (createHeaders as any).mockReturnValueOnce({});
      const breaker2 = new ServerBreaker({ interruptionsOnServer: { baseURL: 'https://example.com' } });
      global.navigator = { sendBeacon: sendBeaconMock } as any;
      breaker2.notifyServerOfInterruption();
      expect(sendBeaconMock).toHaveBeenCalledWith('https://example.com/api/cancel', expect.any(Blob));
    });
  });
});
