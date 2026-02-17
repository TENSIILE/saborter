import { StateObserver } from './state-observer';
import { OnStateChangeCallback } from './state-observer.types';
import { emitRequestState } from './state-observer.utils';

describe('StateObserver', () => {
  let observer: StateObserver;
  let mockCallback1: jest.Mock;
  let mockCallback2: jest.Mock;
  let mockOnStateChange: OnStateChangeCallback;

  beforeEach(() => {
    mockCallback1 = jest.fn();
    mockCallback2 = jest.fn();
    mockOnStateChange = jest.fn();
    observer = new StateObserver();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Конструктор', () => {
    it('должен создавать экземпляр без опций', () => {
      expect(observer).toBeInstanceOf(StateObserver);
      expect(observer.value).toBeUndefined();
      expect(observer.onstatechange).toBeUndefined();
    });

    it('должен создавать экземпляр с опцией onStateChange', () => {
      const observerWithCallback = new StateObserver({
        onStateChange: mockOnStateChange
      });

      expect(observerWithCallback.onstatechange).toBe(mockOnStateChange);
    });
  });

  describe('Метод subscribe', () => {
    it('должен добавлять callback в подписчики', () => {
      observer.subscribe(mockCallback1);

      emitRequestState(observer, 'fulfilled');

      expect(mockCallback1).toHaveBeenCalledWith('fulfilled');
    });

    it('должен возвращать функцию для отписки', () => {
      const unsubscribe = observer.subscribe(mockCallback1);
      expect(typeof unsubscribe).toBe('function');
    });

    it('должен поддерживать несколько подписчиков', () => {
      observer.subscribe(mockCallback1);
      observer.subscribe(mockCallback2);

      emitRequestState(observer, 'fulfilled');

      expect(mockCallback1).toHaveBeenCalledWith('fulfilled');
      expect(mockCallback2).toHaveBeenCalledWith('fulfilled');
    });
  });

  describe('Метод unsubscribe', () => {
    it('должен удалять callback из подписчиков', () => {
      observer.subscribe(mockCallback1);
      observer.unsubscribe(mockCallback1);

      emitRequestState(observer, 'fulfilled');

      expect(mockCallback1).not.toHaveBeenCalled();
    });

    it('не должен выбрасывать ошибку при отписке несуществующего callback', () => {
      expect(() => {
        observer.unsubscribe(mockCallback1);
      }).not.toThrow();
    });
  });

  describe('Метод emit', () => {
    it('должен обновлять значение состояния', () => {
      emitRequestState(observer, 'fulfilled');
      expect(observer.value).toBe('fulfilled');
    });

    it('должен вызывать всех подписчиков с новым состоянием', () => {
      observer.subscribe(mockCallback1);
      observer.subscribe(mockCallback2);

      emitRequestState(observer, 'fulfilled');

      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback1).toHaveBeenCalledWith('fulfilled');
      expect(mockCallback2).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledWith('fulfilled');
    });

    it('должен вызывать onstatechange callback если он задан', () => {
      const observerWithCallback = new StateObserver({
        onStateChange: mockOnStateChange
      });

      emitRequestState(observerWithCallback, 'fulfilled');

      expect(mockOnStateChange).toHaveBeenCalledTimes(1);
      expect(mockOnStateChange).toHaveBeenCalledWith('fulfilled');
    });

    it('не должен вызывать onstatechange если он не задан', () => {
      emitRequestState(observer, 'fulfilled');

      expect(mockCallback1).not.toHaveBeenCalled();
    });

    it('должен корректно обрабатывать множественные вызовы emit', () => {
      observer.subscribe(mockCallback1);

      emitRequestState(observer, 'cancelled');
      emitRequestState(observer, 'pending');
      emitRequestState(observer, 'fulfilled');

      expect(mockCallback1).toHaveBeenCalledTimes(3);
      expect(mockCallback1).toHaveBeenNthCalledWith(1, 'cancelled');
      expect(mockCallback1).toHaveBeenNthCalledWith(2, 'pending');
      expect(mockCallback1).toHaveBeenNthCalledWith(3, 'fulfilled');
    });

    it('должен поддерживать корректное состояние после множественных вызовов emit', () => {
      emitRequestState(observer, 'aborted');
      expect(observer.value).toBe('aborted');

      emitRequestState(observer, 'fulfilled');
      expect(observer.value).toBe('fulfilled');
    });
  });

  describe('Интеграционные тесты: паттерн подписки и отписки', () => {
    it('должен отписываться с использованием возвращенной функции', () => {
      const unsubscribe = observer.subscribe(mockCallback1);

      emitRequestState(observer, 'aborted');
      expect(mockCallback1).toHaveBeenCalledTimes(1);

      unsubscribe();
      emitRequestState(observer, 'fulfilled');

      expect(mockCallback1).toHaveBeenCalledTimes(1);
    });

    it('должен обрабатывать отписку во время эмитации события', () => {
      const unsubscribe = observer.subscribe(mockCallback1);

      mockCallback1.mockImplementation(() => {
        unsubscribe();
      });

      observer.subscribe(mockCallback2);

      emitRequestState(observer, 'aborted');

      expect(mockCallback1).toHaveBeenCalledTimes(1);

      expect(mockCallback2).toHaveBeenCalledTimes(1);

      emitRequestState(observer, 'fulfilled');
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(2);
    });

    it('должен вызывать подписчиков в порядке подписки', () => {
      const callOrder: string[] = [];

      observer.subscribe(() => callOrder.push('первый'));
      observer.subscribe(() => callOrder.push('второй'));
      observer.subscribe(() => callOrder.push('третий'));

      emitRequestState(observer, 'fulfilled');

      expect(callOrder).toEqual(['первый', 'второй', 'третий']);
    });

    it('должен корректно работать с асинхронными подписчиками', async () => {
      const asyncMock = jest.fn().mockResolvedValue('результат');
      observer.subscribe(asyncMock);

      emitRequestState(observer, 'fulfilled');

      await Promise.resolve();

      expect(asyncMock).toHaveBeenCalledWith('fulfilled');
    });
  });
});
