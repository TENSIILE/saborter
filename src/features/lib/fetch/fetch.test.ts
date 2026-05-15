/* eslint-disable no-new */
import { abortSignalAny } from '../abort-signal-any';

jest.mock('../abort-signal-any', () => ({
  abortSignalAny: jest.fn((...signals) => signals[0] || signals[1])
}));

describe('Fetch lib', () => {
  let injectAborterContextIntoHttpRequest;
  let internalFetch;
  let mockFetch;
  let mockAborter;
  let originalFetchRef;

  beforeAll(async () => {
    mockFetch = jest.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = mockFetch;
    originalFetchRef = globalThis.fetch;

    const module = await import('./fetch.lib');

    injectAborterContextIntoHttpRequest = module.injectAborterContextIntoHttpRequest;
    internalFetch = module.internalFetch;
    module.setAborterContextProvisionMode(true);
  });

  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({ ok: true });
    mockAborter = {
      signal: { aborted: false },
      requestOptions: { headers: { 'X-Custom': 'from-aborter' } }
    };

    injectAborterContextIntoHttpRequest(null);
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetchRef;
  });

  describe('injectAborterContextIntoHttpRequest', () => {
    it('should restore original fetch when passing null and fetch is overridden', () => {
      injectAborterContextIntoHttpRequest(mockAborter);

      expect(globalThis.fetch).toBe(internalFetch);

      injectAborterContextIntoHttpRequest(null);

      expect(globalThis.fetch).toBe(originalFetchRef);
    });

    it('should not restore original fetch if it is already original', () => {
      globalThis.fetch = originalFetchRef;

      injectAborterContextIntoHttpRequest(null);

      expect(globalThis.fetch).toBe(originalFetchRef);
    });
  });

  describe('internalFetch', () => {
    it('should call original fetch when no aborter is set', async () => {
      injectAborterContextIntoHttpRequest(null);

      await internalFetch('localhost');

      expect(mockFetch).toHaveBeenCalledWith('localhost', undefined);
    });

    it('should use aborter signal and headers when aborter exists', async () => {
      injectAborterContextIntoHttpRequest(mockAborter);

      const init = {
        method: 'POST',
        headers: { 'X-User': 'test' },
        signal: new AbortController().signal
      };

      await internalFetch('https://example.com', init);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          method: 'POST',
          headers: { 'X-User': 'test', 'X-Custom': 'from-aborter' },
          signal: expect.anything()
        })
      );
      expect(abortSignalAny).toHaveBeenCalledWith(init.signal, mockAborter.signal);
      expect(globalThis.fetch).toBe(originalFetchRef);
    });
  });
});
