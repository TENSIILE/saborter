import { isTimeoutError } from './timeout-error.lib';
import { AbortError } from '../abort-error';
import { TimeoutError } from './timeout-error';

describe('isTimeoutError', () => {
  it('should return true for an AbortError with initiator = "timeout" and cause = TimeoutError', () => {
    const cause = new TimeoutError('Timeout expired', { ms: 5000 });
    const abortError = new AbortError('Timed out', {
      initiator: 'timeout',
      cause
    });
    expect(isTimeoutError(abortError)).toBe(true);
  });

  it('should return false if error is not an AbortError', () => {
    const regularError = new Error('A common error');
    expect(isTimeoutError(regularError)).toBe(false);

    const timeoutError = new TimeoutError('Timedout', { ms: 1000 });
    expect(isTimeoutError(timeoutError)).toBe(false);
  });

  it('should return false if initiator is not equal to "timeout"', () => {
    const abortError = new AbortError('Canceled by user', {
      initiator: 'user',
      cause: new TimeoutError('Time-out', { ms: 1000 })
    });
    expect(isTimeoutError(abortError)).toBe(false);
  });

  it('should return false if cause is not an instance of TimeoutError', () => {
    const abortError = new AbortError('Interrupted', {
      initiator: 'timeout',
      cause: new Error('Wrong type')
    });
    expect(isTimeoutError(abortError)).toBe(false);
  });

  it('should return false if cause is absent', () => {
    const abortError = new AbortError('Timed out', {
      initiator: 'timeout'
    });
    expect(isTimeoutError(abortError)).toBe(false);
  });

  it('should handle null and undefined correctly', () => {
    expect(isTimeoutError(null)).toBe(false);
    expect(isTimeoutError(undefined)).toBe(false);
  });

  it('should handle non-error objects correctly', () => {
    expect(isTimeoutError({})).toBe(false);
    expect(isTimeoutError({ initiator: 'timeout' })).toBe(false);
  });
});
