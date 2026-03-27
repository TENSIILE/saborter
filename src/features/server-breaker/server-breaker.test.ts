import { ServerBreaker } from './server-breaker';
import { createHeaders } from './server-breaker.utils';

jest.mock('./server-breaker.utils', () => ({
  createHeaders: jest.fn()
}));

describe('ServerBreaker', () => {
  const mockHeaders = {
    'x-request-id': 'test-uuid-123',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createHeaders as jest.Mock).mockReturnValue(mockHeaders);
  });

  describe('constructor', () => {
    it('should call createHeaders once', () => {
      // eslint-disable-next-line no-new
      new ServerBreaker();
      expect(createHeaders).toHaveBeenCalledTimes(1);
    });

    it('should store headers in meta.headers', () => {
      const breaker = new ServerBreaker();
      expect(breaker['meta'].headers).toBe(mockHeaders);
    });
  });

  describe('headers getter', () => {
    it('should return headers created in the constructor', () => {
      const breaker = new ServerBreaker();
      expect(breaker.headers).toBe(mockHeaders);
    });

    it('should return undefined if createHeaders returns undefined', () => {
      (createHeaders as jest.Mock).mockReturnValue(undefined);
      const breaker = new ServerBreaker();
      expect(breaker.headers).toBeUndefined();
    });
  });

  describe('integration with createHeaders', () => {
    it('should keep the same object that createHeaders returned', () => {
      const customHeaders = { 'x-request-id': 'custom' };
      (createHeaders as jest.Mock).mockReturnValue(customHeaders);
      const breaker = new ServerBreaker();
      expect(breaker.headers).toBe(customHeaders);
    });
  });
});
