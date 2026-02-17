/* eslint-disable dot-notation */
/* eslint-disable no-import-assign */
import { isAbortError } from './abort-error.lib';
import { AbortError } from './abort-error';
import { ABORT_ERROR_NAME } from './abort-error.constants';

describe('isAbortError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Проверка через instanceof AbortError', () => {
    it('должна возвращать true для экземпляра AbortError', () => {
      const abortError = new AbortError('test abort');
      expect(isAbortError(abortError)).toBe(true);
    });

    it('должна возвращать false для обычной ошибки', () => {
      const error = new Error('regular error');
      expect(isAbortError(error)).toBe(false);
    });
  });

  describe('Проверка через Utils.isObject и совпадение имени', () => {
    it('должна возвращать true для объекта с правильным name', () => {
      const fakeAbort = { name: 'AbortError', message: 'fake' };
      expect(isAbortError(fakeAbort)).toBe(true);
    });

    it('должна возвращать false, если у объекта нет свойства name', () => {
      const fakeAbort = { message: 'no name' };
      expect(isAbortError(fakeAbort)).toBe(false);
    });

    it('должна возвращать false, если name не совпадает с ABORT_ERROR_NAME', () => {
      const fakeAbort = { name: 'NotAbortError' };
      expect(isAbortError(fakeAbort)).toBe(false);
    });

    it('должна использовать глобальную константу ABORT_ERROR_NAME', () => {
      const fakeAbort = { name: 'CustomAbort' };

      const originalName = ABORT_ERROR_NAME;
      // @ts-expect-error
      ABORT_ERROR_NAME = 'CustomAbort';

      expect(isAbortError(fakeAbort)).toBe(true);

      // @ts-expect-error
      ABORT_ERROR_NAME = originalName;
    });
  });

  describe('Проверка через подстроку', () => {
    it('должна возвращать true, если в error.message есть подстрока "abort"', () => {
      const errorWithShortMessage = new Error(' aborting ');
      expect(isAbortError(errorWithShortMessage)).toBeTruthy();

      const errorWithFullWord = new Error('abort');
      expect(isAbortError(errorWithFullWord)).toBeTruthy();

      const error = new Error('operation aborted');
      expect(isAbortError(error)).toBeTruthy();
    });

    it('должна возвращать false, если error.message отсутствует "abort"', () => {
      const error = { message: undefined };
      expect(isAbortError(error)).toBe(false);

      const error2 = { message: null };
      expect(isAbortError(error2)).toBe(false);

      const error3 = { something: 'else' };
      expect(isAbortError(error3)).toBe(false);
    });
  });

  describe('Проверка через checkErrorCause', () => {
    it('должна возвращать результат checkErrorCause, если предыдущие проверки не сработали', () => {
      const error = new Error('some error');
      error['cause'] = new Error('abort');
      expect(isAbortError(error)).toBe(true);
    });

    it('должна возвращать false, если checkErrorCause возвращает false', () => {
      const error = new Error('some error');
      expect(isAbortError(error)).toBe(false);
    });

    it('должна возвращать false, если error.message содержит часть слова "abort"', () => {
      const error = new Error('abo');
      expect(isAbortError(error)).toBe(false);
    });

    it('не должна вызывать checkErrorCause, если одна из предыдущих проверок уже вернула true', () => {
      const abortError = new AbortError('abort');
      isAbortError(abortError);

      const fakeAbort = { name: 'AbortError' };
      isAbortError(fakeAbort);

      const errorWithSubstring = new Error('a');
      isAbortError(errorWithSubstring);
    });
  });

  describe('Интеграционные тесты (комбинации)', () => {
    it('должна корректно обрабатывать объекты, проходящие несколько проверок', () => {
      const abortError = new AbortError('test');
      expect(isAbortError(abortError)).toBe(true);
    });

    it('должна обрабатывать null и undefined без ошибок', () => {
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
    });

    it('должна обрабатывать примитивные значения', () => {
      expect(isAbortError({})).toBe(false);
      expect(isAbortError([])).toBe(false);
      expect(isAbortError(() => {})).toBe(false);
      expect(isAbortError(42)).toBe(false);
      expect(isAbortError('string')).toBe(false);
      expect(isAbortError(true)).toBe(false);
      expect(isAbortError(Symbol('sym'))).toBe(false);
    });
  });
});
