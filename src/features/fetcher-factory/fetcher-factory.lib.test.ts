import { defaultFetcher, makeFetchGetter } from './fetcher-factory.lib';
import { abortSignalAny } from '../lib/abort-signal-any';
import { overrideSymbol } from './fetcher-factory.constants';

jest.mock('../lib/abort-signal-any', () => ({
  abortSignalAny: jest.fn()
}));

jest.mock('./fetcher-factory.constants', () => ({
  overrideSymbol: Symbol('override')
}));

describe('defaultFetcher', () => {
  let mockAbortSignalAny;
  let mockContext;
  let mockFetch;
  let url: string;
  let init: RequestInit;

  beforeEach(() => {
    mockAbortSignalAny = jest.fn().mockReturnValue({ aborted: false });
    (abortSignalAny as jest.Mock).mockImplementation(mockAbortSignalAny);

    mockFetch = jest.fn();
    global.fetch = mockFetch;

    url = '/api/test';
    init = { method: 'POST', headers: { 'X-Custom': 'value' }, signal: { aborted: false } as AbortSignal };
    mockContext = {
      headers: { 'X-Context': 'ctx' },
      signal: { aborted: false },
      save: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a function that takes the context', () => {
    const fetcher = defaultFetcher(url, init);
    expect(typeof fetcher).toBe('function');
  });

  it('should call abortSignalAny with signals from init and context', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: 'ok' }),
      url: 'https://example.com/api/test'
    });
    const fetcher = defaultFetcher(url, init);
    await fetcher(mockContext);
    expect(abortSignalAny).toHaveBeenCalledWith(init.signal, mockContext.signal);
  });

  it('should fetch with the combined signal and headers', async () => {
    const combinedSignal = { aborted: false };
    mockAbortSignalAny.mockReturnValue(combinedSignal);
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: 'ok' }),
      url: 'https://example.com/api/test'
    });

    const fetcher = defaultFetcher(url, init);
    await fetcher(mockContext);

    expect(mockFetch).toHaveBeenCalledWith(url, {
      method: init.method,
      signal: combinedSignal,
      headers: { ...init.headers, ...mockContext.headers }
    });
  });

  it('should parse JSON and return data', async () => {
    const responseData = { id: 1 };
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(responseData),
      url: 'https://example.com/api/test'
    });

    const fetcher = defaultFetcher(url, init);
    const result = await fetcher(mockContext);
    expect(result).toEqual(responseData);
  });

  it('must call context.save with request metadata', async () => {
    const responseUrl = 'https://example.com/api/test';
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
      url: responseUrl
    });

    const fetcher = defaultFetcher(url, init);
    await fetcher(mockContext);

    expect(mockContext.save).toHaveBeenCalledWith({
      url: responseUrl,
      method: init.method
    });
  });

  it('should use the default "get" method if init.method is not specified', async () => {
    const fetcher = defaultFetcher(url, undefined);
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
      url: 'https://example.com/api/test'
    });

    await fetcher(mockContext);

    expect(mockContext.save).toHaveBeenCalledWith({
      url: expect.any(String),
      method: 'get'
    });
  });

  it('should throw an error with the response property if response.ok === false', async () => {
    const errorResponse = { ok: false, status: 404, statusText: 'Not Found' };
    mockFetch.mockResolvedValue(errorResponse);

    const fetcher = defaultFetcher(url, init);
    await expect(fetcher(mockContext)).rejects.toThrow('The request failed');

    try {
      await fetcher(mockContext);
    } catch (err) {
      expect(err.response).toBe(errorResponse);
    }
  });
});

describe('makeFetchGetter', () => {
  it('must return the same function it received', () => {
    const callback = () => {};
    const result = makeFetchGetter(callback);
    expect(result).toBe(callback);
  });

  it('must add the overrideSymbol property to the function', () => {
    const callback = () => {};
    const result = makeFetchGetter(callback);
    expect(result[overrideSymbol]).toBe(overrideSymbol);
  });

  it('must preserve the return type', () => {
    const callback = (a: number) => a + 1;
    const result = makeFetchGetter(callback);
    expect(result(5)).toBe(6);
  });

  it('should work correctly with asynchronous functions', async () => {
    const asyncCallback = async (x: number) => x * 2;
    const result = makeFetchGetter(asyncCallback);
    await expect(result(3)).resolves.toBe(6);
  });
});
