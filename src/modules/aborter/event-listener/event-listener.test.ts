import { EventListener } from './event-listener';
import * as Types from './event-listener.types';

describe('EventListener', () => {
  describe('constructor', () => {
    it('инициализация должна осуществляться с помощью коллбека onabort', () => {
      const mockOnAbort = jest.fn();
      const options: Types.EventListenerOptions = { onabort: mockOnAbort };

      const eventListener = new EventListener(options);

      expect(eventListener.onabort).toBe(mockOnAbort);
    });

    it('инициализация должна выполняться и без коллбека onabort', () => {
      const options: Types.EventListenerOptions = {};

      const eventListener = new EventListener(options);

      expect(eventListener.onabort).toBeUndefined();
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

      it('не должен добавлять повторяющиеся обработчики', () => {
        const eventListener = new EventListener({});
        const mockListener = jest.fn();

        eventListener.addEventListener('aborted', mockListener);
        eventListener.addEventListener('aborted', mockListener);

        const event = { type: 'abort' } as unknown as Types.EventMap['aborted'];
        eventListener.dispatchEvent('aborted', event);

        expect(mockListener).toHaveBeenCalledTimes(1);
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
        const listener = new EventListener({ onabort: mockOnAbort });
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
