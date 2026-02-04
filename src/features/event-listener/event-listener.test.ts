import { EventListener } from './event-listener';
import * as Types from './event-listener.types';

describe('EventListener', () => {
  describe('constructor', () => {
    it('инициализация должна осуществляться с помощью коллбека onabort', () => {
      const mockOnAbort = jest.fn();
      const options: Types.EventListenerConstructorOptions = { onAbort: mockOnAbort };

      const eventListener = new EventListener(options);

      expect(eventListener.onabort).toBe(mockOnAbort);
    });

    it('инициализация должна выполняться и без коллбека onabort', () => {
      const options: Types.EventListenerConstructorOptions = {};

      const eventListener = new EventListener(options);

      expect(eventListener.onabort).toBeUndefined();
    });

    it('поле state.onstatechange должно являться коллбеком onStateChange', () => {
      const fn = jest.fn();

      const eventListener = new EventListener({ onStateChange: fn });

      expect(eventListener.state.onstatechange).toBe(fn);
    });
  });

  describe('abort event', () => {
    describe('addEventListener', () => {
      it('должен добавить обработчик события abort', () => {
        const eventListener = new EventListener({});
        const mockListener = jest.fn();

        eventListener.addEventListener('aborted', mockListener);

        const event = { type: 'aborted' } as unknown as Types.EventMap['aborted'];
        eventListener.dispatchEvent('aborted', event);

        expect(mockListener).toHaveBeenCalledWith(event);
        expect(mockListener).toHaveBeenCalledTimes(1);
      });

      it('возможность добавить несколько обработчиков событий abort', () => {
        const eventListener = new EventListener({});
        const mockListener1 = jest.fn();
        const mockListener2 = jest.fn();

        eventListener.addEventListener('aborted', mockListener1);
        eventListener.addEventListener('aborted', mockListener2);

        const event = { type: 'abort' } as unknown as Types.EventMap['aborted'];
        eventListener.dispatchEvent('aborted', event);

        expect(mockListener1).toHaveBeenCalledWith(event);
        expect(mockListener2).toHaveBeenCalledWith(event);
      });

      it('должен добавлять повторяющиеся обработчики', () => {
        const eventListener = new EventListener({});
        const mockListener = jest.fn();

        eventListener.addEventListener('aborted', mockListener);
        eventListener.addEventListener('aborted', mockListener);

        const event = { type: 'abort' } as unknown as Types.EventMap['aborted'];
        eventListener.dispatchEvent('aborted', event);

        expect(mockListener).toHaveBeenCalledTimes(2);
      });
    });

    describe('removeEventListener', () => {
      it('должен удалить обработчик события abort', () => {
        const eventListener = new EventListener({});
        const mockListener = jest.fn();

        eventListener.addEventListener('aborted', mockListener);
        eventListener.removeEventListener('aborted', mockListener);

        const event = { type: 'abort' } as unknown as Types.EventMap['aborted'];
        eventListener.dispatchEvent('aborted', event);

        expect(mockListener).not.toHaveBeenCalled();
      });

      it('не должна возникать ошибка при удалении несуществующего слушателя', () => {
        const eventListener = new EventListener({});
        const mockListener = jest.fn();

        expect(() => {
          eventListener.removeEventListener('aborted', mockListener);
        }).not.toThrow();
      });

      it('должен удалить конкретный слушатель, если их несколько', () => {
        const eventListener = new EventListener({});
        const mockListener1 = jest.fn();
        const mockListener2 = jest.fn();
        const mockListener3 = jest.fn();

        eventListener.addEventListener('aborted', mockListener1);
        eventListener.addEventListener('aborted', mockListener2);
        eventListener.addEventListener('aborted', mockListener3);

        eventListener.removeEventListener('aborted', mockListener2);

        const event = { type: 'abort' } as unknown as Types.EventMap['aborted'];
        eventListener.dispatchEvent('aborted', event);

        expect(mockListener1).toHaveBeenCalled();
        expect(mockListener2).not.toHaveBeenCalled();
        expect(mockListener3).toHaveBeenCalled();
      });
    });

    describe('dispatchEvent', () => {
      it('необходимо вызвать всех зарегистрированных слушателей для abort события', () => {
        const listener = new EventListener({});
        const mockListener1 = jest.fn();
        const mockListener2 = jest.fn();
        const mockListener3 = jest.fn();

        listener.addEventListener('aborted', mockListener1);
        listener.addEventListener('aborted', mockListener2);
        listener.addEventListener('aborted', mockListener3);

        const event = { type: 'abort', reason: 'test' } as unknown as Types.EventMap['aborted'];
        listener.dispatchEvent('aborted', event);

        expect(mockListener1).toHaveBeenCalledWith(event);
        expect(mockListener2).toHaveBeenCalledWith(event);
        expect(mockListener3).toHaveBeenCalledWith(event);
      });

      it('должен вызывать коллбек onabort при генерации события', () => {
        const mockOnAbort = jest.fn();
        const listener = new EventListener({ onAbort: mockOnAbort });
        const eventListener = jest.fn();

        listener.addEventListener('aborted', eventListener);

        const event = { type: 'abort' } as unknown as Types.EventMap['aborted'];
        listener.dispatchEvent('aborted', event);

        expect(eventListener).toHaveBeenCalledWith(event);
        expect(mockOnAbort).toHaveBeenCalled();
      });

      it('должен обработать пустой массив слушателей', () => {
        const listener = new EventListener({});

        const event = { type: 'abort' } as unknown as Types.EventMap['aborted'];

        expect(() => {
          listener.dispatchEvent('aborted', event);
        }).not.toThrow();
      });
    });

    describe('EventListener с поддержкой флага once', () => {
      describe('Флаг once', () => {
        it('должен вызывать обработчик только один раз при once: true', () => {
          const eventListener = new EventListener({});
          const mockListener = jest.fn();

          eventListener.addEventListener('aborted', mockListener, { once: true });

          const event = { type: 'aborted', reason: 'тест' } as Types.EventMap['aborted'];

          eventListener.dispatchEvent('aborted', event);
          eventListener.dispatchEvent('aborted', event);

          expect(mockListener).toHaveBeenCalledTimes(1);
          expect(mockListener).toHaveBeenCalledWith(event);
        });

        it('должен вызывать обработчик многократно при once: false (по умолчанию)', () => {
          const eventListener = new EventListener({});
          const mockListener = jest.fn();

          eventListener.addEventListener('aborted', mockListener);

          const event = { type: 'aborted' } as Types.EventMap['aborted'];

          eventListener.dispatchEvent('aborted', event);
          eventListener.dispatchEvent('aborted', event);
          eventListener.dispatchEvent('aborted', event);

          expect(mockListener).toHaveBeenCalledTimes(3);
        });

        it('должен автоматически удалять обработчик после первого вызова при once: true', () => {
          const eventListener = new EventListener({});
          const onceListener = jest.fn();
          const regularListener = jest.fn();

          eventListener.addEventListener('aborted', onceListener, { once: true });
          eventListener.addEventListener('aborted', regularListener);

          const event = { type: 'aborted' } as Types.EventMap['aborted'];

          eventListener.dispatchEvent('aborted', event);
          eventListener.dispatchEvent('aborted', event);

          expect(onceListener).toHaveBeenCalledTimes(1);
          expect(regularListener).toHaveBeenCalledTimes(2);
        });

        it('должен корректно работать с несколькими once-обработчиками', () => {
          const eventListener = new EventListener({});
          const mockListener1 = jest.fn();
          const mockListener2 = jest.fn();
          const mockListener3 = jest.fn();

          eventListener.addEventListener('aborted', mockListener1, { once: true });
          eventListener.addEventListener('aborted', mockListener2, { once: true });
          eventListener.addEventListener('aborted', mockListener3);

          const event = { type: 'aborted' } as Types.EventMap['aborted'];

          eventListener.dispatchEvent('aborted', event);
          eventListener.dispatchEvent('aborted', event);

          expect(mockListener1).toHaveBeenCalledTimes(1);
          expect(mockListener2).toHaveBeenCalledTimes(1);
          expect(mockListener3).toHaveBeenCalledTimes(2);
        });

        it('должен позволять удалить once-обработчик до его срабатывания', () => {
          const eventListener = new EventListener({});
          const mockListener = jest.fn();

          eventListener.addEventListener('aborted', mockListener, { once: true });
          eventListener.removeEventListener('aborted', mockListener);

          const event = { type: 'aborted' } as Types.EventMap['aborted'];
          eventListener.dispatchEvent('aborted', event);

          expect(mockListener).not.toHaveBeenCalled();
        });

        it('должен работать корректно со свойством onabort', () => {
          const mockOnAbort = jest.fn();
          const eventListener = new EventListener({ onAbort: mockOnAbort });
          const onceListener = jest.fn();

          eventListener.addEventListener('aborted', onceListener, { once: true });

          const event = { type: 'aborted' } as Types.EventMap['aborted'];

          eventListener.dispatchEvent('aborted', event);
          eventListener.dispatchEvent('aborted', event);

          expect(onceListener).toHaveBeenCalledTimes(1);
          expect(mockOnAbort).toHaveBeenCalledTimes(2);
        });

        it('не должен мешать другим обработчикам при удалении once-обработчика', () => {
          const eventListener = new EventListener({});

          const onceListener = jest.fn();
          const regularListener = jest.fn();

          eventListener.addEventListener('aborted', onceListener, { once: true });
          eventListener.addEventListener('aborted', regularListener);

          eventListener.removeEventListener('aborted', onceListener);

          const event = { type: 'aborted' } as Types.EventMap['aborted'];
          eventListener.dispatchEvent('aborted', event);

          expect(onceListener).not.toHaveBeenCalled();
          expect(regularListener).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('Изолирование слушателей', () => {
      it('должен изолировать слушателей между различными экземплярами', () => {
        const listener1 = new EventListener({});
        const listener2 = new EventListener({});

        const mockListener1 = jest.fn();
        const mockListener2 = jest.fn();

        listener1.addEventListener('aborted', mockListener1);
        listener2.addEventListener('aborted', mockListener2);

        const event = { type: 'abort' } as unknown as Types.EventMap['aborted'];
        listener1.dispatchEvent('aborted', event);

        expect(mockListener1).toHaveBeenCalled();
        expect(mockListener2).not.toHaveBeenCalled();
      });
    });
  });
});
