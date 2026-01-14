interface TimeoutOptions {
  hasThrow?: boolean;
  ms: number;
}

export class TimeoutError extends Error {
  /**
   *The timestamp in milliseconds when the error was created.
   @readonly
   @returns Date.now();
   */
  public readonly timestamp = Date.now();

  public hasThrow: boolean;

  public ms?: number;

  constructor(message: string, options?: TimeoutOptions) {
    super(message);

    this.hasThrow = options?.hasThrow ?? false;
    this.ms = options?.ms;
  }
}
