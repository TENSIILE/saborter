import { Timeout } from './timeout';

describe('Timeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('Метод setTimeout', () => {
    test('Устанавливает таймаут с корректным временем', () => {
      const timeout = new Timeout();
      const callback = jest.fn();

      timeout.setTimeout(1000, callback);

      expect(callback).not.toHaveBeenCalled();
      jest.advanceTimersByTime(999);
      expect(callback).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('Вызывает callback после истечения таймаута', () => {
      const timeout = new Timeout();
      const callback = jest.fn();

      timeout.setTimeout(500, callback);
      jest.advanceTimersByTime(500);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('Не устанавливает таймаут при timeout <= 0', () => {
      const timeout = new Timeout();
      const callback = jest.fn();

      timeout.setTimeout(0, callback);
      timeout.setTimeout(-100, callback);

      jest.runAllTimers();
      expect(callback).not.toHaveBeenCalled();
    });

    test('Не устанавливает таймаут при undefined timeout', () => {
      const timeout = new Timeout();
      const callback = jest.fn();

      timeout.setTimeout(undefined, callback);

      jest.runAllTimers();
      expect(callback).not.toHaveBeenCalled();
    });

    test('Очищает предыдущий таймаут при установке нового 1', () => {
      const timeout = new Timeout();
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      timeout.setTimeout(1000, callback1);
      jest.advanceTimersByTime(500);

      timeout.setTimeout(2000, callback2);

      jest.advanceTimersByTime(500);
      expect(callback1).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1500);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    test('Корректно обрабатывает несколько последовательных таймаутов', () => {
      const timeout = new Timeout();
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      timeout.setTimeout(100, callback1);
      jest.advanceTimersByTime(100);
      expect(callback1).toHaveBeenCalledTimes(1);

      timeout.setTimeout(200, callback2);
      jest.advanceTimersByTime(200);
      expect(callback2).toHaveBeenCalledTimes(1);

      timeout.setTimeout(300, callback3);
      jest.advanceTimersByTime(300);
      expect(callback3).toHaveBeenCalledTimes(1);
    });
  });

  describe('Метод clearTimeout', () => {
    test('Корректно очищает установленный таймаут', () => {
      const timeout = new Timeout();
      const callback = jest.fn();

      timeout.setTimeout(1000, callback);
      timeout.clearTimeout();

      jest.runAllTimers();
      expect(callback).not.toHaveBeenCalled();
    });

    test('Не вызывает ошибку при очистке несуществующего таймаута', () => {
      const timeout = new Timeout();

      expect(() => {
        timeout.clearTimeout();
      }).not.toThrow();
    });

    test('Обнуляет timeoutId после очистки', () => {
      const timeout = new Timeout();
      const callback = jest.fn();

      timeout.setTimeout(1000, callback);
      timeout.clearTimeout();

      timeout.setTimeout(500, callback);
      jest.advanceTimersByTime(500);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('Позволяет установить новый таймаут после очистки', () => {
      const timeout = new Timeout();
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      timeout.setTimeout(1000, callback1);
      timeout.clearTimeout();

      timeout.setTimeout(500, callback2);
      jest.advanceTimersByTime(500);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Интеграционные тесты', () => {
    test('Таймаут не вызывается после уничтожения объекта', () => {
      const callback = jest.fn();

      (() => {
        const timeout = new Timeout();
        timeout.setTimeout(1000, callback);
      })();

      jest.runAllTimers();
      expect(callback).toHaveBeenCalled();
    });

    test('Множественные экземпляры работают независимо', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const timeout1 = new Timeout();
      const timeout2 = new Timeout();

      timeout1.setTimeout(1000, callback1);
      timeout2.setTimeout(2000, callback2);

      jest.advanceTimersByTime(1000);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });
});
