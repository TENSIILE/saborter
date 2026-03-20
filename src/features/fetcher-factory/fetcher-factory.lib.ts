import { FetcherFactory, DefaultFetcherFactoryArgs, AbortableFetcherContext } from './fetcher-factory.types';
import { abortSignalAny } from '../lib';

export const defaultFetcher: FetcherFactory<DefaultFetcherFactoryArgs> = (url: string, init?: RequestInit) => {
  return async (context: AbortableFetcherContext) => {
    const signal = abortSignalAny(init?.signal, context.signal);

    const response = await fetch(url, {
      ...init,
      signal,
      headers: { ...init?.headers, ...context.headers }
    });

    context.save(response);

    if (!response.ok) {
      const error = new Error('The request failed');
      (error as any).response = response;
    }

    const data = await response.json();

    return data;
  };
};

export const overrideSymbol = Symbol('Fetcher.override');

export const override = <C extends (...args: any[]) => any>(callback: C): C & typeof overrideSymbol => {
  // eslint-disable-next-line no-param-reassign
  (callback as any)[overrideSymbol] = overrideSymbol;

  return callback as C & typeof overrideSymbol;
};
