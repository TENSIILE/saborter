import { get } from './get';
import { isObject } from './is-object';

describe('isObject', () => {
  test('возвращает true для простого объекта', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });

  test('возвращает false для null', () => {
    expect(isObject(null)).toBe(false);
  });

  test('возвращает false для массивов', () => {
    expect(isObject([])).toBe(false);
    expect(isObject([1, 2, 3])).toBe(false);
  });

  test('возвращает false для примитивов', () => {
    expect(isObject(42)).toBe(false);
    expect(isObject('string')).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(Symbol('sym'))).toBe(false);
    expect(isObject(123n)).toBe(false);
  });

  test('возвращает true для Date и других встроенных объектов', () => {
    expect(isObject(new Date())).toBe(true);
    expect(isObject(new Map())).toBe(true);
    expect(isObject(new Set())).toBe(true);
  });

  test('возвращает false для функций', () => {
    expect(isObject(() => {})).toBe(false);
    expect(isObject(function () {})).toBe(false);
  });
});

describe('get', () => {
  const testObject = {
    a: {
      b: {
        c: 42,
        d: [1, 2, { e: 'nested' }],
        f: null,
        g: undefined
      },
      h: 'direct'
    },
    i: null
  };

  test('получает вложенное значение по пути', () => {
    expect(get(testObject, 'a.b.c')).toBe(42);
    expect(get(testObject, 'a.h')).toBe('direct');
  });

  test('обрабатывает массивы в пути', () => {
    expect(get(testObject, 'a.b.d.0')).toBe(1);
    expect(get(testObject, 'a.b.d.2.e')).toBe('nested');
  });

  test('возвращает null и undefined значения', () => {
    expect(get(testObject, 'a.b.f')).toBe(null);
    expect(get(testObject, 'a.b.g')).toBe(undefined);
    expect(get(testObject, 'i')).toBe(null);
  });

  test('возвращает undefined для несуществующих путей', () => {
    expect(get(testObject, 'a.b.x')).toBe(undefined);
    expect(get(testObject, 'a.b.c.d')).toBe(undefined);
    expect(get(testObject, 'x.y.z')).toBe(undefined);
    expect(get(testObject, '')).toBe(undefined);
  });

  test('работает с пустым объектом', () => {
    expect(get({}, 'a.b.c')).toBe(undefined);
  });

  test('работает с типизацией', () => {
    const result = get<typeof testObject, number>(testObject, 'a.b.c');
    expect(result).toBe(42);

    const stringResult = get<typeof testObject, string>(testObject, 'a.h');
    expect(stringResult).toBe('direct');
  });

  test('работает с примитивами', () => {
    expect(get({ a: 5 }, 'a')).toBe(5);
    expect(get({ a: false }, 'a')).toBe(false);
    expect(get({ a: 'text' }, 'a')).toBe('text');
  });

  test('обрабатывает путь с точками в ключах (не поддерживается)', () => {
    const obj = { 'a.b': { c: 1 } };
    expect(get(obj, 'a.b.c')).toBe(undefined);
  });

  test('работает с пустым путем', () => {
    expect(get(testObject, '')).toBe(undefined);
    expect(get({ a: 1 }, '')).toBe(undefined);
  });

  test('не падает при передаче null/undefined как объекта', () => {
    expect(get(null as any, 'a.b')).toBe(null);
    expect(get(undefined as any, 'a.b')).toBe(undefined);
  });
});
