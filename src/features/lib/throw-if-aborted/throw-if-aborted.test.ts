/* eslint-disable dot-notation */
import { AbortError } from '../../abort-error';
import { throwIfAborted } from './throw-if-aborted.lib';

describe('Функция throwIfAborted', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Когда сигнал не отменен', () => {
    it('не должна выбрасывать ошибку', () => {
      const controller = new AbortController();
      const { signal } = controller;

      expect(() => throwIfAborted(signal)).not.toThrow();
    });

    it('должна возвращать undefined', () => {
      const controller = new AbortController();
      const { signal } = controller;

      expect(throwIfAborted(signal)).toBeUndefined();
    });
  });

  describe('Когда сигнал отменен', () => {
    describe('И причина отмены - экземпляр AbortError', () => {
      it('должна выбрасывать ту же самую причину', () => {
        const controller = new AbortController();
        const { signal } = controller;
        const abortError = new AbortError('Operation was aborted');

        controller.abort(abortError);

        expect(() => throwIfAborted(signal)).toThrow(abortError);
        expect(() => throwIfAborted(signal)).toThrow('Operation was aborted');
      });

      it('должна сохранять все свойства оригинальной ошибки', () => {
        const controller = new AbortController();
        const { signal } = controller;
        const originalError = new AbortError('Custom message');
        originalError['customProperty'] = 'custom value';
        originalError['code'] = 123;

        controller.abort(originalError);

        try {
          throwIfAborted(signal);
        } catch (error) {
          expect(error).toBe(originalError);
          expect(error.customProperty).toBe('custom value');
          expect(error.code).toBe(123);
        }
      });
    });

    describe('И причина отмены - НЕ экземпляр AbortError', () => {
      it('должна создавать новый AbortError со стандартным сообщением', () => {
        const controller = new AbortController();
        const { signal } = controller;

        controller.abort('Simple string reason');

        expect(() => throwIfAborted(signal)).toThrow(AbortError);
        expect(() => throwIfAborted(signal)).toThrow('signal is aborted without message');
      });

      it('должна сохранять оригинальную причину в свойстве reason', () => {
        const controller = new AbortController();
        const { signal } = controller;
        const originalReason = { code: 500, message: 'Server error' };

        controller.abort(originalReason);

        try {
          throwIfAborted(signal);
        } catch (error) {
          expect(error.reason).toBe(originalReason);
          expect(error.reason.code).toBe(500);
        }
      });

      it('должна корректно обрабатывать разные типы причин', () => {
        const testCases = [
          { reason: 'string reason' },
          { reason: 404 },
          { reason: null },
          //   { reason: undefined },
          { reason: new Error('Regular error') },
          { reason: { custom: 'object' } },
          { reason: ['array', 'item'] }
        ];

        testCases.forEach(({ reason }) => {
          const controller = new AbortController();
          const { signal } = controller;

          controller.abort(reason);

          try {
            throwIfAborted(signal);
          } catch (error) {
            expect(error).toBeInstanceOf(AbortError);
            expect(error.reason).toBe(reason);
          }
        });
      });
    });

    describe('Когда сигнал отменен без указания причины', () => {
      it('должна создавать AbortError со стандартным сообщением', () => {
        const controller = new AbortController();
        const { signal } = controller;

        controller.abort();

        expect(() => throwIfAborted(signal)).toThrow(AbortError);
        expect(() => throwIfAborted(signal)).toThrow('signal is aborted without message');
      });
    });
  });

  describe('Поведение при вызове с разными типами сигналов', () => {
    it('должна корректно работать с пользовательским AbortSignal', () => {
      const signal = {
        aborted: true,
        reason: new AbortError('Custom signal')
      };

      expect(() => throwIfAborted(signal as any)).toThrow('Custom signal');
    });

    it('должна корректно обрабатывать сигнал с aborted:false', () => {
      const signal = {
        aborted: false,
        reason: null
      };

      expect(() => throwIfAborted(signal as any)).not.toThrow();
    });
  });

  describe('Интеграционные сценарии', () => {
    it('должна работать в цепочке промисов', async () => {
      const controller = new AbortController();
      const { signal } = controller;

      const promise = Promise.resolve()
        .then(() => {
          throwIfAborted(signal);

          return 'success';
        })
        .catch((error) => {
          return error;
        });

      controller.abort(new AbortError('Aborted in test'));

      const result = await promise;
      expect(result).toBeInstanceOf(AbortError);
      expect(result.message).toBe('Aborted in test');
    });

    it('должна использоваться для проверки в циклах', () => {
      const controller = new AbortController();
      const { signal } = controller;
      const processedItems: number[] = [];

      const processItems = (items: number[]) => {
        // eslint-disable-next-line no-restricted-syntax
        for (const item of items) {
          throwIfAborted(signal);
          processedItems.push(item);
        }
      };

      const items = [1, 2, 3, 4, 5];

      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < 3; i++) {
        expect(() => throwIfAborted(signal)).not.toThrow();
        processedItems.push(items[i]);
      }

      controller.abort('Stop processing');

      expect(() => processItems(items.slice(3))).toThrow();
      expect(processedItems).toEqual([1, 2, 3]);
    });
  });
});
