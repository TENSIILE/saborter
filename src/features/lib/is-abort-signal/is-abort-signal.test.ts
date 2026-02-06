import { isAbortSignal } from './is-abort-signal.lib';

describe('isAbortSignal', () => {
  describe('Должна возвращать true для валидных AbortSignal', () => {
    it('должна возвращать true для сигнала из AbortController', () => {
      const controller = new AbortController();
      expect(isAbortSignal(controller.signal)).toBe(true);
    });

    it('должна возвращать true для уже отмененного сигнала', () => {
      const controller = new AbortController();
      controller.abort();
      expect(isAbortSignal(controller.signal)).toBe(true);
    });

    it('должна возвращать true для пользовательского сигнала с правильной структурой', () => {
      const fakeSignal = {
        aborted: false,
        reason: undefined,
        onabort: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      };

      Object.setPrototypeOf(fakeSignal, AbortSignal.prototype);

      expect(isAbortSignal(fakeSignal)).toBe(true);
    });
  });

  describe('Должна возвращать false для невалидных значений', () => {
    it('должна возвращать false для null', () => {
      expect(isAbortSignal(null)).toBe(false);
    });

    it('должна возвращать false для undefined', () => {
      expect(isAbortSignal(undefined)).toBe(false);
    });

    it('должна возвращать false для обычных объектов', () => {
      expect(isAbortSignal({})).toBe(false);
      expect(isAbortSignal({ aborted: false })).toBe(false);
    });

    it('должна возвращать false для объектов с похожими свойствами', () => {
      const fakeSignal = {
        aborted: false,
        reason: undefined,
        onabort: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      };

      expect(isAbortSignal(fakeSignal)).toBe(false);
    });

    it('должна возвращать false для примитивных типов', () => {
      expect(isAbortSignal(123)).toBe(false);
      expect(isAbortSignal('signal')).toBe(false);
      expect(isAbortSignal(true)).toBe(false);
      expect(isAbortSignal(Symbol('signal'))).toBe(false);
    });

    it('должна возвращать false для других типов событий', () => {
      expect(isAbortSignal(new Event('abort'))).toBe(false);
      expect(isAbortSignal(new EventTarget())).toBe(false);
    });

    it('должна возвращать false для функций', () => {
      expect(isAbortSignal(() => {})).toBe(false);
      expect(isAbortSignal(function () {})).toBe(false);
    });

    it('должна возвращать false для массивов', () => {
      expect(isAbortSignal([])).toBe(false);
      expect(isAbortSignal([new AbortController().signal])).toBe(false);
    });

    it('должна возвращать false для других встроенных объектов', () => {
      expect(isAbortSignal(new Date())).toBe(false);
      expect(isAbortSignal(/regex/)).toBe(false);
      expect(isAbortSignal(new Map())).toBe(false);
      expect(isAbortSignal(new Set())).toBe(false);
      expect(isAbortSignal(new Promise(() => {}))).toBe(false);
    });
  });

  describe('Поведение при наследовании', () => {
    it('должна работать с сигналами, созданными через Object.create', () => {
      const protoSignal = Object.create(AbortSignal.prototype);
      expect(isAbortSignal(protoSignal)).toBe(true);
    });
  });

  describe('Интеграционные сценарии', () => {
    it('должна работать как type guard в TypeScript', () => {
      const unknownValue = new AbortController().signal;

      if (isAbortSignal(unknownValue)) {
        expect(unknownValue.aborted).toBeDefined();
        expect(typeof unknownValue.addEventListener).toBe('function');
      }
    });

    it('должна использоваться для проверки параметров функций', () => {
      const setupSignal = (signal: any) => {
        if (!isAbortSignal(signal)) {
          throw new TypeError('Expected an AbortSignal');
        }

        return signal;
      };

      const controller = new AbortController();
      expect(() => setupSignal(controller.signal)).not.toThrow();
      expect(() => setupSignal({})).toThrow('Expected an AbortSignal');
    });

    it('должна корректно работать в условиях', () => {
      const signals = [new AbortController().signal, {}, null, new AbortController().signal, undefined];

      const validSignals = signals.filter(isAbortSignal);
      expect(validSignals).toHaveLength(2);
      validSignals.forEach((signal) => {
        expect(signal).toBeInstanceOf(AbortSignal);
      });
    });
  });

  describe('Краевые случаи и граничные условия', () => {
    it('должна корректно работать с замороженными сигналами', () => {
      const controller = new AbortController();
      const frozenSignal = Object.freeze(controller.signal);
      expect(isAbortSignal(frozenSignal)).toBe(true);
    });

    it('должна корректно работать с запечатанными сигналами', () => {
      const controller = new AbortController();
      const sealedSignal = Object.seal(controller.signal);
      expect(isAbortSignal(sealedSignal)).toBe(true);
    });

    it('должна корректно работать с прокси-объектами', () => {
      const controller = new AbortController();
      const proxySignal = new Proxy(controller.signal, {});
      expect(isAbortSignal(proxySignal)).toBe(true);
    });

    it('должна корректно работать при изменении прототипа', () => {
      const obj = {};
      Object.setPrototypeOf(obj, AbortSignal.prototype);
      expect(isAbortSignal(obj)).toBe(true);
    });

    it('должна корректно работать в разных контекстах выполнения', () => {
      const controller = new AbortController();
      const { signal } = controller;

      expect(isAbortSignal(signal)).toBe(true);

      const checkInClosure = (() => {
        const innerSignal = signal;

        return isAbortSignal(innerSignal);
      })();

      expect(checkInClosure).toBe(true);
    });
  });
});
