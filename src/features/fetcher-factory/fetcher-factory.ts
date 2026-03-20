import * as Types from './fetcher-factory.types';
import { defaultFetcher, overrideSymbol, override } from './fetcher-factory.lib';

export class FetcherFactory<
  Factory extends Types.FetcherFactory<[any?, ...any[]]> = Types.FetcherFactory<Types.DefaultFetcherFactoryArgs>
> {
  protected fetcherFactory: Factory;

  protected meta: Types.AbortableMeta = {};

  protected signal: AbortSignal;

  constructor(props: Types.FetcherFactoryProps<Factory>) {
    this.fetcherFactory = (props.fetcher ?? defaultFetcher) as Factory;
    this.signal = props.signal;
  }

  protected createContext = (): Types.AbortableFetcherContext => {
    return {
      save: (data: any) => {
        this.meta.response = data;
      },
      headers: this.meta.headers,
      signal: this.signal
    };
  };

  public setAbortSignal = (signal: AbortSignal): void => {
    this.signal = signal;
  };

  public get fetcher(): Factory extends typeof overrideSymbol
    ? ReturnType<ReturnType<Factory>>
    : <Result>(...args: Parameters<Factory>) => Result {
    const context = this.createContext();

    if (!this.fetcherFactory[overrideSymbol]) {
      // @ts-expect-error
      return (...args: Parameters<Factory>) => {
        return this.fetcherFactory(...args)(context);
      };
    }

    return this.fetcherFactory([])(context);
  }
}
