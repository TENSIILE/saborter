/* eslint-disable dot-notation */
import { ReusableAborter } from './reusable-aborter';
import { canAttractListeners } from './reusable-aborter.utils';
import { logger } from '../../shared/logger';
import { AbortError } from '../../features/abort-error';

jest.mock('../../shared/logger', () => ({
  logger: {
    info: jest.fn()
  }
}));

describe('ReusableAborter', () => {
  let aborter: ReusableAborter;

  beforeEach(() => {
    aborter = new ReusableAborter();
  });

  describe('конструктор', () => {
    it('должен создавать экземпляр с собственным AbortController', () => {
      expect(aborter).toBeInstanceOf(ReusableAborter);
      expect(aborter['abortController']).toBeInstanceOf(AbortController);
      expect(aborter['originalSignalApi']).toBeDefined();
      expect(aborter['originalSignalListenerParams']).toEqual([]);
    });

    it('должен сохранять оригинальные методы addEventListener/removeEventListener', () => {
      const originalAdd = AbortSignal.prototype.addEventListener;
      const originalRemove = AbortSignal.prototype.removeEventListener;

      expect(aborter['originalSignalApi'].addEventListener).toBe(originalAdd);
      expect(aborter['originalSignalApi'].removeEventListener).toBe(originalRemove);
    });

    it('должен переопределять методы сигнала', () => {
      const { signal } = aborter;

      expect(signal.addEventListener).not.toBe(AbortSignal.prototype.addEventListener);
      expect(signal.removeEventListener).not.toBe(AbortSignal.prototype.removeEventListener);
    });
  });

  describe('assignSignalListeners', () => {
    it('должен сохранять параметры listener, если options не содержит once=true', () => {
      const { signal } = aborter;
      const listener = jest.fn();

      signal.addEventListener('abort', listener);
      expect(aborter['originalSignalListenerParams']).toHaveLength(1);
      expect(aborter['originalSignalListenerParams'][0]).toMatchObject({
        type: 'abort',
        listener,
        options: undefined
      });
    });

    it('не должен сохранять listener с once: true', () => {
      const { signal } = aborter;
      const listener = jest.fn();
      signal.addEventListener('abort', listener, { once: true });
      expect(aborter['originalSignalListenerParams']).toHaveLength(0);
    });

    it('должен сохранять listener с options = { once: false }', () => {
      const { signal } = aborter;
      const listener = jest.fn();

      signal.addEventListener('abort', listener, { once: false });
      expect(aborter['originalSignalListenerParams']).toHaveLength(1);
    });

    it('должен сохранять несколько listener на одно событие', () => {
      const { signal } = aborter;
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      signal.addEventListener('abort', listener1);
      signal.addEventListener('abort', listener2);
      expect(aborter['originalSignalListenerParams']).toHaveLength(2);
    });

    it('должен вызывать оригинальный addEventListener', () => {
      const spy = jest.spyOn(aborter['originalSignalApi'], 'addEventListener');
      const { signal } = aborter;
      const listener = jest.fn();

      signal.addEventListener('abort', listener);
      expect(spy).toHaveBeenCalledWith('abort', listener, undefined);
    });

    describe('removeEventListener', () => {
      it('удаляет listener из сохранённого массива', () => {
        const { signal } = aborter;
        const listener = jest.fn();

        signal.addEventListener('abort', listener);
        expect(aborter['originalSignalListenerParams']).toHaveLength(1);

        signal.removeEventListener('abort', listener);
        expect(aborter['originalSignalListenerParams']).toHaveLength(0);
      });

      it('вызывает оригинальный removeEventListener', () => {
        const spy = jest.spyOn(aborter['originalSignalApi'], 'removeEventListener');
        const { signal } = aborter;
        const listener = jest.fn();

        signal.addEventListener('abort', listener);
        signal.removeEventListener('abort', listener);
        expect(spy).toHaveBeenCalledWith('abort', listener, undefined);
      });
    });
  });

  describe('saveSignalListenersApi', () => {
    it('должен сохранять методы addEventListener и removeEventListener из переданного сигнала', () => {
      const mockSignal = new AbortController().signal;
      const originalAdd = mockSignal.addEventListener;
      const originalRemove = mockSignal.removeEventListener;

      aborter['saveSignalListenersApi'](mockSignal);

      expect(aborter['originalSignalApi'].addEventListener).toBe(originalAdd);
      expect(aborter['originalSignalApi'].removeEventListener).toBe(originalRemove);
    });

    it('должен корректно работать, даже если методы сигнала уже были переопределены', () => {
      const mockSignal = new AbortController().signal;
      const fakeAdd = jest.fn();
      const fakeRemove = jest.fn();

      mockSignal.addEventListener = fakeAdd;
      mockSignal.removeEventListener = fakeRemove;

      aborter['saveSignalListenersApi'](mockSignal);

      expect(aborter['originalSignalApi'].addEventListener).toBe(fakeAdd);
      expect(aborter['originalSignalApi'].removeEventListener).toBe(fakeRemove);
    });
  });

  describe('recoverySignalListeners', () => {
    it('должен копировать onabort со старого сигнала на новый', () => {
      const oldSignal = aborter.signal;
      const onabortHandler = jest.fn();
      oldSignal.onabort = onabortHandler;

      const newController = new AbortController();
      const newSignal = newController.signal;

      aborter['recoverySignalListeners'](oldSignal, newSignal);
      expect(newSignal.onabort).toBe(onabortHandler);
    });

    it('должен повторно добавлять все сохранённые listener на новый сигнал', () => {
      const signal1 = aborter.signal;
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      signal1.addEventListener('abort', listener1);
      signal1.addEventListener('abort', listener2, { once: false });

      const newController = new AbortController();
      const newSignal = newController.signal;
      const addSpy = jest.spyOn(newSignal, 'addEventListener');

      aborter['recoverySignalListeners'](signal1, newSignal);

      expect(addSpy).toHaveBeenCalledTimes(2);
      expect(addSpy).toHaveBeenCalledWith('abort', listener1, undefined);
      expect(addSpy).toHaveBeenCalledWith('abort', listener2, { once: false });
    });

    it('должен повторно применять переопределение методов на новом сигнале', () => {
      const oldSignal = aborter.signal;
      const newController = new AbortController();
      const newSignal = newController.signal;

      aborter['recoverySignalListeners'](oldSignal, newSignal);
      expect(newSignal.addEventListener).not.toBe(AbortSignal.prototype.addEventListener);
      expect(newSignal.removeEventListener).not.toBe(AbortSignal.prototype.removeEventListener);
    });
  });

  describe('signal (геттер)', () => {
    it('должен возвращать текущий сигнал', () => {
      expect(aborter.signal).toBe(aborter['abortController'].signal);
    });

    it('должен возвращать новый сигнал после abort', () => {
      const oldSignal = aborter.signal;
      aborter.abort();
      expect(aborter.signal).not.toBe(oldSignal);
      expect(aborter.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('abort', () => {
    it('должен отменять текущий контроллер с переданной причиной', () => {
      const abortSpy = jest.spyOn(aborter['abortController'], 'abort');
      const reason = 'test abort';
      aborter.abort(reason);
      expect(abortSpy).toHaveBeenCalledWith(new AbortError('signal is aborted without message', { reason }));
    });

    it('должен создавать новый AbortController', () => {
      const oldController = aborter['abortController'];
      aborter.abort();
      expect(aborter['abortController']).not.toBe(oldController);
      expect(aborter['abortController']).toBeInstanceOf(AbortController);
    });

    it('должен восстанавливать listener на новый сигнал', () => {
      const listener = jest.fn();
      aborter.signal.addEventListener('abort', listener);
      aborter.abort();

      // The new signal must receive the same listener
      const newSignal = aborter.signal;
      // Emulating the cancellation of a new signal
      const abortEvent = new Event('abort');
      newSignal.dispatchEvent(abortEvent);

      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('должен восстанавливать onabort на новый сигнал', () => {
      const onabortHandler = jest.fn();
      aborter.signal.onabort = onabortHandler;
      aborter.abort();

      const newSignal = aborter.signal;
      const abortEvent = new Event('abort');
      newSignal.dispatchEvent(abortEvent);

      expect(onabortHandler).toHaveBeenCalledTimes(2);
    });

    it('не должен восстанавливать once‑listener (они не сохраняются)', () => {
      const onceListener = jest.fn();
      aborter.signal.addEventListener('abort', onceListener, { once: true });
      aborter.abort();

      const newSignal = aborter.signal;
      const abortEvent = new Event('abort');
      newSignal.dispatchEvent(abortEvent);

      expect(onceListener).toHaveBeenCalledTimes(1);
    });

    it('должен позволять многократные вызовы abort с сохранением listener', () => {
      const listener = jest.fn();
      aborter.signal.addEventListener('abort', listener);

      aborter.abort('first');
      // After the first abort the listener is bound to the new signal
      aborter.signal.dispatchEvent(new Event('abort'));
      expect(listener).toHaveBeenCalledTimes(2);

      aborter.abort('second');
      aborter.signal.dispatchEvent(new Event('abort'));
      expect(listener).toHaveBeenCalledTimes(4);
    });

    it('должен корректно работать без аргументов', () => {
      expect(() => aborter.abort()).not.toThrow();
      expect(aborter.signal.aborted).toBe(false); // new signal not cancelled
    });
  });

  describe('Должен не сихронизировать слушателей при отключенной настройке', () => {
    it('должен позволять многократные вызовы abort без сохранения listener и onabort', () => {
      const listener = jest.fn();
      const callback = jest.fn();

      aborter = new ReusableAborter({ attractListeners: false });
      aborter.signal.onabort = callback;

      aborter.signal.addEventListener('abort', listener);

      aborter.abort('first');
      aborter.signal.dispatchEvent(new Event('abort'));
      expect(callback).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledTimes(1);

      aborter.abort('second');
      aborter.signal.dispatchEvent(new Event('abort'));
      expect(callback).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('должен позволять многократные вызовы abort без сохранения listener, но с сохранением onabort', () => {
      const listener = jest.fn();
      const callback = jest.fn();

      aborter = new ReusableAborter({ attractListeners: { eventListeners: false, onabort: true } });
      aborter.signal.onabort = callback;

      aborter.signal.addEventListener('abort', listener);

      aborter.abort('first');
      aborter.signal.dispatchEvent(new Event('abort'));
      expect(callback).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenCalledTimes(1);

      aborter.abort('second');
      aborter.signal.dispatchEvent(new Event('abort'));
      expect(callback).toHaveBeenCalledTimes(4);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('должен позволять многократные вызовы abort с сохранением listener, но без сохранения onabort', () => {
      const listener = jest.fn();
      const callback = jest.fn();

      aborter = new ReusableAborter({ attractListeners: { eventListeners: true, onabort: false } });
      aborter.signal.onabort = callback;

      aborter.signal.addEventListener('abort', listener);

      aborter.abort('first');
      aborter.signal.dispatchEvent(new Event('abort'));
      expect(callback).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledTimes(2);

      aborter.abort('second');
      aborter.signal.dispatchEvent(new Event('abort'));
      expect(callback).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledTimes(4);
    });
  });

  describe('интеграционные сценарии', () => {
    it('должен позволять отменять асинхронные операции и переиспользовать сигнал', async () => {
      const aborter1 = new ReusableAborter();

      function createAsyncOp() {
        return new Promise((resolve, reject) => {
          const { signal } = aborter1;

          const timeout = setTimeout(() => resolve('done'), 1000);

          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('aborted'));
          });
        });
      }

      // First operation - cancel
      const op1 = createAsyncOp();
      aborter1.abort('stop first');
      await expect(op1).rejects.toThrow('aborted');

      // the second operation - we use the same instance the signal is already new
      const op2 = createAsyncOp();
      // Don't cancel – it should complete successfully (in the test with fake timers)
      jest.useFakeTimers();
      const promise = op2;
      jest.advanceTimersByTime(1000);
      await expect(promise).resolves.toBe('done');
      jest.useRealTimers();
    });

    it('должен корректно обрабатывать множественные listener с разными опциями', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      aborter.signal.addEventListener('abort', listener1);
      aborter.signal.addEventListener('abort', listener2, { once: true });
      aborter.signal.addEventListener('abort', listener3, { capture: true });

      expect(aborter['originalSignalListenerParams']).toHaveLength(2);
      expect(aborter['originalSignalListenerParams'].map((p) => p.listener)).toEqual([listener1, listener3]);

      aborter.abort();
      const newSignal = aborter.signal;

      newSignal.dispatchEvent(new Event('abort'));
      expect(listener1).toHaveBeenCalledTimes(2);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(2);
    });

    it('должен сохранять listener, добавленные через addEventListener с булевым параметром (useCapture)', () => {
      const listener = jest.fn();

      aborter.signal.addEventListener('abort', listener, true);

      expect(aborter['originalSignalListenerParams']).toHaveLength(1);
      expect(aborter['originalSignalListenerParams'][0].options).toBe(true);
    });
  });

  describe('краевые случаи', () => {
    it('должен обрабатывать undefined/null в качестве listener (штатно упадёт, но не сломает логику сохранения)', () => {
      expect(() => {
        // @ts-ignore
        aborter.signal.addEventListener('abort', undefined);
      }).toThrow();
      expect(aborter['originalSignalListenerParams']).toHaveLength(0);
    });

    it('должен корректно работать после многократного вызова abort без listener', () => {
      expect(() => {
        aborter.abort();
        aborter.abort();
        aborter.abort();
      }).not.toThrow();
    });
  });

  describe('canAttractListeners util', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('когда attractListeners = falsy (undefined, null, false, 0, "")', () => {
      it('должен возвращать false и логировать полное отключение для undefined', () => {
        expect(canAttractListeners(undefined, 'onabort')).toBe(false);
        expect(logger.info).toHaveBeenCalledWith(
          'ReusableAborter -> Synchronization of listeners of the signal abortion was completely disabled'
        );
      });

      it('должен возвращать false и логировать полное отключение для null', () => {
        expect(canAttractListeners(null as any, 'eventListeners')).toBe(false);
        expect(logger.info).toHaveBeenCalledWith(
          'ReusableAborter -> Synchronization of listeners of the signal abortion was completely disabled'
        );
      });

      it('должен возвращать false и логировать полное отключение для false', () => {
        expect(canAttractListeners(false, 'onabort')).toBe(false);
        expect(logger.info).toHaveBeenCalledWith(
          'ReusableAborter -> Synchronization of listeners of the signal abortion was completely disabled'
        );
      });

      it('должен возвращать false и логировать полное отключение для 0', () => {
        expect(canAttractListeners(0 as any, 'onabort')).toBe(false);
        expect(logger.info).toHaveBeenCalledWith(
          'ReusableAborter -> Synchronization of listeners of the signal abortion was completely disabled'
        );
      });

      it('должен возвращать false и логировать полное отключение для пустой строки', () => {
        expect(canAttractListeners('' as any, 'onabort')).toBe(false);
        expect(logger.info).toHaveBeenCalledWith(
          'ReusableAborter -> Synchronization of listeners of the signal abortion was completely disabled'
        );
      });
    });

    describe('когда attractListeners = true', () => {
      it('должен возвращать true для любого targetName без логирования', () => {
        expect(canAttractListeners(true, 'onabort')).toBe(true);
        expect(canAttractListeners(true, 'eventListeners')).toBe(true);
        expect(logger.info).not.toHaveBeenCalled();
      });
    });

    describe('когда attractListeners = объект AttractListeners', () => {
      it('должен возвращать значение соответствующего поля', () => {
        const config = { eventListeners: true, onabort: false };
        expect(canAttractListeners(config, 'onabort')).toBe(false);
        expect(canAttractListeners(config, 'eventListeners')).toBe(true);
      });

      it('должен логировать отключение для конкретного типа, если значение false', () => {
        const config = { eventListeners: true, onabort: false };
        canAttractListeners(config, 'onabort');
        expect(logger.info).toHaveBeenCalledWith('ReusableAborter -> Listener sync was disabled for "onabort"');

        canAttractListeners(config, 'eventListeners');
        expect(logger.info).toHaveBeenCalledTimes(1); // только для onabort
      });

      it('не должен логировать, если значение true', () => {
        const config = { eventListeners: true, onabort: true };
        canAttractListeners(config, 'onabort');
        expect(logger.info).not.toHaveBeenCalled();
      });
    });
  });
});
