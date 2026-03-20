type AbortSignalLike = AbortSignal | null | undefined;

export const abortSignalAny = <T extends AbortSignalLike | AbortSignalLike[]>(...args: T[]): AbortSignal => {
  const signals = args.flat();

  const controller = new AbortController();

  signals.forEach((signal) => {
    const handler = () => {
      controller.abort(signal?.reason);

      signals.forEach((sign) => {
        sign?.removeEventListener('abort', handler);
      });
    };

    signal?.addEventListener('abort', handler, { once: true });
  });

  return controller.signal;
};
