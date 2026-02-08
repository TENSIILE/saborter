import { timeInMilliseconds } from './time-in-milliseconds.lib';

describe('timeInMilliseconds', () => {
  describe('Базовые преобразования', () => {
    it('должна корректно преобразовывать миллисекунды', () => {
      expect(timeInMilliseconds({ milliseconds: 500 })).toBe(500);
      expect(timeInMilliseconds({ milliseconds: 0 })).toBe(0);
      expect(timeInMilliseconds({ milliseconds: 1000 })).toBe(1000);
    });

    it('должна корректно преобразовывать секунды в миллисекунды', () => {
      expect(timeInMilliseconds({ seconds: 1 })).toBe(1000);
      expect(timeInMilliseconds({ seconds: 0 })).toBe(0);
      expect(timeInMilliseconds({ seconds: 2.5 })).toBe(2500);
      expect(timeInMilliseconds({ seconds: 60 })).toBe(60000);
    });

    it('должна корректно преобразовывать минуты в миллисекунды', () => {
      expect(timeInMilliseconds({ minutes: 1 })).toBe(60000);
      expect(timeInMilliseconds({ minutes: 0 })).toBe(0);
      expect(timeInMilliseconds({ minutes: 2.5 })).toBe(150_000);
      expect(timeInMilliseconds({ minutes: 60 })).toBe(3_600_000);
    });

    it('должна корректно преобразовывать часы в миллисекунды', () => {
      expect(timeInMilliseconds({ hours: 1 })).toBe(3_600_000); // 1 * 60 * 60 * 1000
      expect(timeInMilliseconds({ hours: 0 })).toBe(0);
      expect(timeInMilliseconds({ hours: 2 })).toBe(7_200_000); // 2 * 60 * 60 * 1000
      expect(timeInMilliseconds({ hours: 1.5 })).toBe(5_400_000); // 1.5 * 60 * 60 * 1000
    });
  });

  describe('Комбинированные преобразования', () => {
    it('должна корректно суммировать несколько компонентов', () => {
      expect(
        timeInMilliseconds({
          hours: 1,
          minutes: 30,
          seconds: 45,
          milliseconds: 500
        })
      ).toBe(
        3_600_000 + // 1 hour
          1_800_000 + // 30 minutes
          45000 + // 45 seconds
          500 // 500 milliseconds
      );
    });

    it('должна работать с частичными конфигурациями', () => {
      expect(timeInMilliseconds({ minutes: 2, seconds: 30 })).toBe(150_000);
      expect(timeInMilliseconds({ hours: 1, milliseconds: 250 })).toBe(3_600_250);
      expect(timeInMilliseconds({ seconds: 10, milliseconds: 100 })).toBe(10100);
    });

    it('должна корректно обрабатывать десятичные значения', () => {
      expect(timeInMilliseconds({ minutes: 0.5, seconds: 30.5 })).toBe(60500);
      expect(timeInMilliseconds({ hours: 0.5 })).toBe(1_800_000); // 0.5 * 60 * 60 * 1000
      expect(timeInMilliseconds({ hours: 1.25, minutes: 15 })).toBe(5_400_000); // 1.25 * 3600000 + 15 * 60000
    });
  });

  describe('Значения по умолчанию', () => {
    it('должна использовать 0 для неуказанных полей', () => {
      expect(timeInMilliseconds({})).toBe(0);
      expect(timeInMilliseconds({ seconds: 10 })).toBe(10000);
      expect(timeInMilliseconds({ milliseconds: 100 })).toBe(100);
    });

    it('должна корректно обрабатывать undefined как значение поля', () => {
      expect(timeInMilliseconds({ seconds: undefined })).toBe(0);
      expect(timeInMilliseconds({ minutes: undefined, milliseconds: 100 })).toBe(100);
    });

    it('не должна корректно обрабатывать null как значение конфига', () => {
      expect(() => timeInMilliseconds(null as any)).toThrow();
    });

    it('не должна корректно обрабатывать undefined как значение конфига', () => {
      expect(() => timeInMilliseconds(undefined as any)).toThrow();
    });
  });

  describe('Валидация типов', () => {
    it('должна выбрасывать TypeError для строковых значений', () => {
      expect(() => timeInMilliseconds({ seconds: '10' as unknown as number })).toThrow(TypeError);
      expect(() => timeInMilliseconds({ minutes: '2' as unknown as number })).toThrow(TypeError);
      expect(() => timeInMilliseconds({ milliseconds: '100' as unknown as number })).toThrow(TypeError);
      expect(() => timeInMilliseconds({ hours: '1' as unknown as number })).toThrow(TypeError);
    });

    it('должна выбрасывать TypeError для boolean значений', () => {
      expect(() => timeInMilliseconds({ seconds: true as unknown as number })).toThrow(TypeError);
      expect(() => timeInMilliseconds({ minutes: false as unknown as number })).toThrow(TypeError);
    });

    it('должна выбрасывать TypeError для объектов и массивов', () => {
      expect(() => timeInMilliseconds({ seconds: {} as unknown as number })).toThrow(TypeError);
      expect(() => timeInMilliseconds({ minutes: [] as unknown as number })).toThrow(TypeError);
      expect(() => timeInMilliseconds({ milliseconds: { value: 100 } as unknown as number })).toThrow(TypeError);
    });

    it('должна выбрасывать TypeError для функций', () => {
      expect(() => timeInMilliseconds({ seconds: (() => 10) as unknown as number })).toThrow(TypeError);
    });

    it('должна выбрасывать TypeError с правильным сообщением', () => {
      try {
        timeInMilliseconds({ seconds: 'invalid' as unknown as number });
      } catch (error) {
        expect(error.message).toBe('Function values ​​are not numbers!');
        expect(error).toBeInstanceOf(TypeError);
      }
    });

    it('должна выбрасывать ошибку при первом некорректном значении', () => {
      expect(() =>
        timeInMilliseconds({
          milliseconds: 100,
          seconds: 'invalid' as unknown as number,
          minutes: 2
        })
      ).toThrow(TypeError);
    });
  });

  describe('Краевые случаи', () => {
    it('должна корректно обрабатывать отрицательные значения', () => {
      expect(timeInMilliseconds({ seconds: -1 })).toBe(-1000);
      expect(timeInMilliseconds({ minutes: -2.5 })).toBe(-150_000);
      expect(timeInMilliseconds({ hours: -1 })).toBe(-3_600_000);
      expect(timeInMilliseconds({ hours: -1, minutes: 30 })).toBe(-1_800_000); // -1 hour + 30 minutes = -30 minutes
    });

    it('должна корректно обрабатывать очень большие числа', () => {
      expect(timeInMilliseconds({ milliseconds: Number.MAX_SAFE_INTEGER })).toBe(Number.MAX_SAFE_INTEGER);
      expect(timeInMilliseconds({ seconds: 1_000_000 })).toBe(1_000_000_000);
      expect(timeInMilliseconds({ hours: 1000 })).toBe(3_600_000_000);
    });

    it('должна корректно обрабатывать NaN', () => {
      expect(timeInMilliseconds({ seconds: NaN })).toBeNaN();
      expect(timeInMilliseconds({ minutes: NaN, milliseconds: 100 })).toBeNaN();
    });

    it('должна корректно обрабатывать Infinity', () => {
      expect(timeInMilliseconds({ seconds: Infinity })).toBe(Infinity);
      expect(timeInMilliseconds({ minutes: -Infinity })).toBe(-Infinity);
    });

    it('должна корректно обрабатывать 0 для всех полей', () => {
      expect(
        timeInMilliseconds({
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0
        })
      ).toBe(0);
    });
  });

  describe('Производительность и безопасность', () => {
    it('не должна зависеть от порядка полей в объекте', () => {
      const config1 = { milliseconds: 100, seconds: 2, minutes: 1, hours: 0 };
      const config2 = { hours: 0, minutes: 1, seconds: 2, milliseconds: 100 };
      expect(timeInMilliseconds(config1)).toBe(timeInMilliseconds(config2));
    });

    it('не должна корректно обрабатывать объекты с дополнительными свойствами', () => {
      const config = {
        milliseconds: 500,
        seconds: 2,
        minutes: 1,
        hours: 0,
        extraProp: 'should be ignored',
        anotherProp: 123
      };

      expect(() => timeInMilliseconds(config)).toThrow();
    });

    it('должна быть иммутабельной - не изменять входной объект', () => {
      const originalConfig = { seconds: 10, minutes: 1 };
      const configCopy = { ...originalConfig };

      timeInMilliseconds(originalConfig);

      expect(originalConfig).toEqual(configCopy);
    });
  });

  describe('Специфичные сценарии использования', () => {
    it('должна работать для создания таймаутов', () => {
      // Creating a timeout of 2.5 seconds
      const timeoutMs = timeInMilliseconds({ seconds: 2, milliseconds: 500 });
      expect(timeoutMs).toBe(2500);

      // Timeout for 1 hour 15 minutes
      const longTimeout = timeInMilliseconds({ hours: 1, minutes: 15 });
      expect(longTimeout).toBe(4_500_000); // 1.25 hours in milliseconds
    });

    it('должна работать для конвертации времени между единицами', () => {
      // 1 hour 15 minutes 30 seconds in milliseconds
      const totalMs = timeInMilliseconds({
        hours: 1,
        minutes: 15,
        seconds: 30
      });
      expect(totalMs).toBe(4_530_000); // 1 * 3600000 + 15 * 60000 + 30 * 1000

      // 2.5 days in milliseconds
      const twoAndHalfDays = timeInMilliseconds({ hours: 60 }); // 2.5 * 24
      expect(twoAndHalfDays).toBe(216_000_000);
    });

    it('должна работать с API таймеров', () => {
      // Using with setTimeout
      const delay = timeInMilliseconds({ seconds: 1 });
      expect(typeof delay).toBe('number');
      expect(delay).toBeGreaterThan(0);

      // Using with setInterval
      const interval = timeInMilliseconds({ minutes: 5 });
      expect(interval).toBe(300_000);
    });
  });

  describe('Реальные примеры', () => {
    it('должна корректно работать с временными интервалами', () => {
      // Data update interval: every 5 minutes
      const updateInterval = timeInMilliseconds({ minutes: 5 });
      expect(updateInterval).toBe(300_000);

      // Cache time: 1 hour
      const cacheTTL = timeInMilliseconds({ hours: 1 });
      expect(cacheTTL).toBe(3_600_000);

      // Request timeout: 30 seconds
      const requestTimeout = timeInMilliseconds({ seconds: 30 });
      expect(requestTimeout).toBe(30000);
    });

    it('должна правильно рассчитывать общее время выполнения задач', () => {
      const totalTime = timeInMilliseconds({
        minutes: 30 + 1, // 30 minutes + 1 minute
        seconds: 45 + 20 // 45 seconds + 20 seconds
      });
      expect(totalTime).toBe(31 * 60000 + 65 * 1000); // 31 minutes 65 seconds
    });

    it('должна корректно работать с видео/аудио длительностью', () => {
      // Video length 2:30:15 (2 hours 30 minutes 15 seconds)
      const videoDuration = timeInMilliseconds({
        hours: 2,
        minutes: 30,
        seconds: 15
      });
      expect(videoDuration).toBe(2 * 3_600_000 + 30 * 60000 + 15 * 1000);
      expect(videoDuration).toBe(9_015_000);
    });
  });
});
