import { ServerBreaker } from './server-breaker';
import { createAbortableHeaders } from './server-breaker.utils';

jest.mock('./server-breaker.utils', () => ({
  createAbortableHeaders: jest.fn()
}));

describe('ServerBreaker', () => {
  const mockHeaders = {
    'x-request-id': 'test-uuid-123',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createAbortableHeaders as jest.Mock).mockReturnValue(mockHeaders);
  });

  describe('constructor', () => {
    it('should call createAbortableHeaders once', () => {
      // eslint-disable-next-line no-new
      new ServerBreaker();
      expect(createAbortableHeaders).toHaveBeenCalledTimes(1);
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

    it('should return undefined if createAbortableHeaders returns undefined', () => {
      (createAbortableHeaders as jest.Mock).mockReturnValue(undefined);
      const breaker = new ServerBreaker();
      expect(breaker.headers).toBeUndefined();
    });
  });

  describe('integration with createAbortableHeaders', () => {
    it('should keep the same object that createAbortableHeaders returned', () => {
      const customHeaders = { 'x-request-id': 'custom' };
      (createAbortableHeaders as jest.Mock).mockReturnValue(customHeaders);
      const breaker = new ServerBreaker();
      expect(breaker.headers).toBe(customHeaders);
    });
  });
});
