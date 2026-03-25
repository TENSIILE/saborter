import { FetcherFactory, DefaultFetcherFactoryArgs, FetcherFactoryContext } from './fetcher-factory.types';
import { abortSignalAny } from '../lib';
import { overrideSymbol } from './fetcher-factory.constants';

/**
 * Default fetcher factory that creates an abortable fetch function.
 *
 * This factory produces a function that:
 * - Merges the provided signal with the context signal using `abortSignalAny`.
 * - Performs a `fetch` request with the combined signal.
 * - If the response is not ok, throws an error with the `response` property attached.
 * - Parses the response as JSON.
 * - Saves the request metadata (url and method) via `context.save`.
 *
 * @type {FetcherFactory<DefaultFetcherFactoryArgs>}
 *
 * @param {string} url - The request URL.
 * @param {RequestInit} [init] - Optional fetch options.
 * @returns {(context: FetcherFactoryContext) => Promise<any>}
 *          A function that accepts a context and returns a promise resolving to the parsed JSON.
 *
 * @example
 * const fetcher = defaultFetcher('/api/users', { method: 'GET' });
 * const context = { headers: {}, signal: controller.signal, save: console.log };
 * fetcher(context).then(data => console.log(data));
 */
export const defaultFetcher: FetcherFactory<DefaultFetcherFactoryArgs> = (url: string, init?: RequestInit) => {
  return async (context: FetcherFactoryContext) => {
    const signal = abortSignalAny(init?.signal, context.signal);

    const response = await fetch(url, {
      ...init,
      signal,
      headers: { ...init?.headers, ...context.headers }
    });

    if (!response.ok) {
      const error = new Error('The request failed');
      (error as any).response = response;

      throw error;
    }

    const data = await response.json();

    context.save({ url: response.url, method: init?.method ?? 'get' });

    return data;
  };
};

/**
 * Marks a callback as overridable by attaching a unique symbol property.
 *
 * This function is used internally to indicate that a fetcher factory
 * should be treated specially (e.g., when it is intended to be overridden
 * by a custom implementation). The resulting function receives the
 * `overrideSymbol` property, which is used by the `FetcherFactory` class
 * to differentiate between standard and overridden factories.
 *
 * @template C - The type of the callback function.
 * @param {C} callback - The callback function to mark.
 * @returns {C & typeof overrideSymbol} The same function with the `overrideSymbol` property attached.
 *
 * @example
 * const myFetcher = makeFetchGetter((url, init) => {
 *   return (context) => fetch(url, { ...init, signal: context.signal });
 * });
 * // `myFetcher[overrideSymbol]` is now truthy.
 */
export const makeFetchGetter = <C extends (...args: any[]) => any>(callback: C): C & typeof overrideSymbol => {
  // eslint-disable-next-line no-param-reassign
  (callback as any)[overrideSymbol] = overrideSymbol;

  return callback as C & typeof overrideSymbol;
};
