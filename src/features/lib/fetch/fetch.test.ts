import { abortSignalAny } from '../abort-signal-any';

jest.mock('../abort-signal-any', () => ({
  abortSignalAny: jest.fn((...signals) => signals[0] || signals[1])
}));

describe('Fetch lib', () => {
  let saveRunningAborterToContext;
  let internalFetch;
  let setAborterContextProvisionToFetchMode;
  let mockFetch;
  let mockAborter;
  let originalFetchRef;

  beforeAll(async () => {
    mockFetch = jest.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = mockFetch;
    originalFetchRef = globalThis.fetch;

    const module = await import('./fetch.lib');

    saveRunningAborterToContext = module.saveRunningAborterToContext;
    internalFetch = module.internalFetch;
    setAborterContextProvisionToFetchMode = module.setAborterContextProvisionToFetchMode;
  });

  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({ ok: true });
    mockAborter = {
      signal: { aborted: false },
      requestOptions: { headers: { 'X-Custom': 'from-aborter' } }
    };

    setAborterContextProvisionToFetchMode(true);
    saveRunningAborterToContext(null);
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetchRef;
  });

  describe('saveRunningAborterToContext', () => {
    it('should restore original fetch when passing null and fetch is overridden', () => {
      saveRunningAborterToContext(mockAborter);

      expect(globalThis.fetch).toBe(internalFetch);

      saveRunningAborterToContext(null);

      expect(globalThis.fetch).toBe(originalFetchRef);
    });

    it('should not restore original fetch if it is already original', () => {
      globalThis.fetch = originalFetchRef;

      saveRunningAborterToContext(null);

      expect(globalThis.fetch).toBe(originalFetchRef);
    });
  });

  describe('internalFetch', () => {
    it('should call original fetch when no aborter is set', async () => {
      saveRunningAborterToContext(null);

      await internalFetch('localhost');

      expect(mockFetch).toHaveBeenCalledWith('localhost', undefined);
    });

    it('should use aborter signal and headers when aborter exists', async () => {
      saveRunningAborterToContext(mockAborter);

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
