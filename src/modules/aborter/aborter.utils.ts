import { AbortError } from '../../features/abort-error';
import { ErrorMessage } from './aborter.constants';
import { AbortableFetcherContext, FetcherFactory, DefaultFetcherFactoryArgs } from './aborter.types';
import { abortSignalAny } from '../../features/lib';

export const getAbortErrorByReason = (reason?: any): AbortError => {
  if (reason instanceof AbortError) {
    return reason;
  }

  return new AbortError(ErrorMessage.AbortedSignalWithoutMessage, {
    reason,
    type: 'aborted',
    initiator: 'user'
  });
};

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
