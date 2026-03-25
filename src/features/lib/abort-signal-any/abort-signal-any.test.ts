import { abortSignalAny } from './abort-signal-any.lib';
import { AbortError } from '../../abort-error';

describe('abortSignalAny', () => {
  let controller1: AbortController;
  let controller2: AbortController;
  let controller3: AbortController;

  beforeEach(() => {
    controller1 = new AbortController();
    controller2 = new AbortController();
    controller3 = new AbortController();
  });

  describe('basic behavior', () => {
    it('must create a new AbortSignal', () => {
      const signal = abortSignalAny(controller1.signal);

      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);
    });

    it('must create a new AbortSignal', () => {
      const signal = abortSignalAny(controller1.signal, controller2.signal);
      expect(signal.aborted).toBe(false);

      controller1.abort('reason1');

      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBeInstanceOf(AbortError);
      expect(signal.reason.reason).toBe('reason1');
    });

    it('must respond to the first triggered signal', () => {
      const signal = abortSignalAny(controller1.signal, controller2.signal);

      controller2.abort('reason2');

      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBeInstanceOf(AbortError);
      expect(signal.reason.reason).toBe('reason2');
    });

    it('must be aborted immediately if any of the signals are already cancelled', () => {
      controller1.abort('pre');

      const signal = abortSignalAny(controller1.signal, controller2.signal);

      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBeInstanceOf(AbortError);
      expect(signal.reason.reason).toBe('pre');
    });

    it('must correctly handle null and undefined signals', () => {
      expect(() => abortSignalAny(null, undefined, controller1.signal)).not.toThrow();

      const signal = abortSignalAny(null, controller1.signal);

      controller1.abort('ok');

      expect(signal.aborted).toBe(true);
    });
  });

  describe('working with arrays', () => {
    it('must receive an array of signals', () => {
      const signal = abortSignalAny([controller1.signal, controller2.signal]);

      controller1.abort();

      expect(signal.aborted).toBe(true);
    });

    it('must accept a set of signals in rest format', () => {
      const signal = abortSignalAny(controller1.signal, controller2.signal);

      controller2.abort();

      expect(signal.aborted).toBe(true);
    });
  });

  describe('cleaning handlers', () => {
    it('must remove handlers after cancellation (to avoid leaks)', () => {
      const removeSpy1 = jest.spyOn(controller1.signal, 'removeEventListener');
      const removeSpy2 = jest.spyOn(controller2.signal, 'removeEventListener');

      const signal = abortSignalAny(controller1.signal, controller2.signal);
      controller1.abort();

      expect(removeSpy1).toHaveBeenCalled();
      expect(removeSpy2).toHaveBeenCalled();
    });
  });

  describe('working with the reason for cancellation', () => {
    it('must transmit the reason for cancellation from the first triggered signal', () => {
      const reason = { code: 'USER_CANCELLED' };

      const signal = abortSignalAny(controller1.signal, controller2.signal);

      controller1.abort(reason);

      expect(signal.reason).toBeInstanceOf(AbortError);
      expect(signal.reason.reason).toEqual(reason);
    });

    it('must pass a reason even if it is undefined', () => {
      const signal = abortSignalAny(controller1.signal);

      controller1.abort();

      expect(signal.reason).toBeInstanceOf(AbortError);
      expect(signal.reason.reason).toBeUndefined();
      expect(signal.reason.cause).toBeInstanceOf(DOMException);
    });
  });
});
