/* eslint-disable dot-notation */
/* eslint-disable no-import-assign */
import { isAbortError, copyAbortError } from './abort-error.lib';
import { AbortError } from './abort-error';
import { ABORT_ERROR_NAME } from './abort-error.constants';

describe('isAbortError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Checking via instanceof AbortError', () => {
    it('must return true for an AbortError instance', () => {
      const abortError = new AbortError('test abort');
      expect(isAbortError(abortError)).toBe(true);
    });

    it('should return false for a normal error', () => {
      const error = new Error('regular error');
      expect(isAbortError(error)).toBe(false);
    });
  });

  describe('checking via Utils.isObject and name matching', () => {
    it('should return true for an object with the correct name', () => {
      const fakeAbort = { name: 'AbortError', message: 'fake' };
      expect(isAbortError(fakeAbort)).toBe(true);
    });

    it('should return false if the object does not have a name property', () => {
      const fakeAbort = { message: 'no name' };
      expect(isAbortError(fakeAbort)).toBe(false);
    });

    it('should return false if name does not match ABORT_ERROR_NAME', () => {
      const fakeAbort = { name: 'NotAbortError' };
      expect(isAbortError(fakeAbort)).toBe(false);
    });

    it('must use the global constant ABORT_ERROR_NAME', () => {
      const fakeAbort = { name: 'CustomAbort' };

      const originalName = ABORT_ERROR_NAME;
      // @ts-expect-error
      ABORT_ERROR_NAME = 'CustomAbort';

      expect(isAbortError(fakeAbort)).toBe(true);

      // @ts-expect-error
      ABORT_ERROR_NAME = originalName;
    });
  });

  describe('Checking via substring', () => {
    it('should return true if the error.message contains the substring "abort"', () => {
      const errorWithShortMessage = new Error(' aborting ');
      expect(isAbortError(errorWithShortMessage)).toBeTruthy();

      const errorWithFullWord = new Error('abort');
      expect(isAbortError(errorWithFullWord)).toBeTruthy();

      const error = new Error('operation aborted');
      expect(isAbortError(error)).toBeTruthy();
    });

    it('should return false if error.message is missing "abort"', () => {
      const error = { message: undefined };
      expect(isAbortError(error)).toBe(false);

      const error2 = { message: null };
      expect(isAbortError(error2)).toBe(false);

      const error3 = { something: 'else' };
      expect(isAbortError(error3)).toBe(false);
    });
  });

  describe('Checking via checkErrorCause', () => {
    it('should return the result of checkErrorCause if the previous checks failed', () => {
      const error = new Error('some error');
      error['cause'] = new Error('abort');
      expect(isAbortError(error)).toBe(true);
    });

    it('should return false if checkErrorCause returns false', () => {
      const error = new Error('some error');
      expect(isAbortError(error)).toBe(false);
    });

    it('should return false if error.message contains part of the word "abort"', () => {
      const error = new Error('abo');
      expect(isAbortError(error)).toBe(false);
    });

    it('should not call checkErrorCause if one of the previous checks has already returned true', () => {
      const abortError = new AbortError('abort');
      isAbortError(abortError);

      const fakeAbort = { name: 'AbortError' };
      isAbortError(fakeAbort);

      const errorWithSubstring = new Error('a');
      isAbortError(errorWithSubstring);
    });
  });

  describe('Integration tests', () => {
    it('should correctly handle objects passing multiple checks', () => {
      const abortError = new AbortError('test');
      expect(isAbortError(abortError)).toBe(true);
    });

    it('should handle null and undefined without errors', () => {
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
    });

    it('primitive values ​​must be processed', () => {
      expect(isAbortError({})).toBe(false);
      expect(isAbortError([])).toBe(false);
      expect(isAbortError(() => {})).toBe(false);
      expect(isAbortError(42)).toBe(false);
      expect(isAbortError('string')).toBe(false);
      expect(isAbortError(true)).toBe(false);
      expect(isAbortError(Symbol('sym'))).toBe(false);
    });
  });

  describe('copyAbortError', () => {
    let originalError: AbortError;

    beforeEach(() => {
      jest.clearAllMocks();
      originalError = new AbortError('Original message', {
        type: 'cancelled',
        initiator: 'user',
        metadata: { id: 1 },
        reason: 'test reason'
      });
    });

    it('should create a new AbortError with the original message when no override provided', () => {
      const copy = copyAbortError(originalError);

      expect(AbortError).toHaveBeenCalledWith(
        'Original message',
        expect.objectContaining({
          ...originalError,
          cause: originalError
        })
      );

      expect(copy.cause).toBe(originalError);
    });

    it('should override the message when provided', () => {
      const copy = copyAbortError(originalError, { message: 'New message' });

      expect(AbortError).toHaveBeenCalledWith(
        'New message',
        expect.objectContaining({
          ...originalError,
          cause: originalError,
          message: 'New message'
        })
      );
    });

    it('should override other properties when provided', () => {
      const override = {
        type: 'aborted',
        initiator: 'timeout',
        metadata: { new: true },
        reason: 'new reason'
      } as const;

      const copy = copyAbortError(originalError, override);

      expect(AbortError).toHaveBeenCalledWith(
        'Original message',
        expect.objectContaining({
          ...originalError,
          ...override,
          cause: originalError
        })
      );
    });

    it('should not allow overriding cause, timestamp, stack, or name', () => {
      const override = {
        cause: new Error('fake cause'),
        timestamp: 12345,
        stack: 'fake stack',
        name: 'FakeError'
      };

      expect(() => copyAbortError(originalError, override as any)).toThrow(TypeError);
    });

    it('should preserve all original properties not overridden', () => {
      const copy = copyAbortError(originalError, { metadata: { new: true } });

      expect(copy.type).toBe(originalError.type);
      expect(copy.initiator).toBe(originalError.initiator);
      expect(copy.reason).toBe(originalError.reason);
      expect(copy.metadata).toEqual({ new: true });
      expect(copy.cause).toBe(originalError);
    });

    it('should work with minimal AbortError (no extra properties)', () => {
      const minimalError = new AbortError('Minimal');

      const copy = copyAbortError(minimalError);

      expect(AbortError).toHaveBeenCalledWith(
        'Minimal',
        expect.objectContaining({
          cause: minimalError
        })
      );
    });

    it('should handle undefined override', () => {
      const copy = copyAbortError(originalError, undefined);

      expect(AbortError).toHaveBeenCalledWith(
        'Original message',
        expect.objectContaining({
          ...originalError,
          cause: originalError
        })
      );
    });
  });
});
