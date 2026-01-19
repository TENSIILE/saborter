export interface TimeoutErrorOptions {
  /**
   * A flag that determines whether to throw the error further.
   */
  hasThrow?: boolean;
  /**
   * Time in milliseconds after which interrupts should be started.
   */
  ms: number;
}

export class TimeoutError extends Error {
  /**
   *The timestamp in milliseconds when the error was created.
   @readonly
   @returns Date.now();
   */
  public readonly timestamp = Date.now();

  /**
   * A field indicating whether an error was thrown.
   */
  public hasThrow: boolean;

  /**
   * A field displaying the time in milliseconds after which the request was interrupted.
   */
  public ms?: number;

  constructor(message: string, options?: TimeoutErrorOptions) {
    super(message);

    this.hasThrow = options?.hasThrow ?? false;
    this.ms = options?.ms;
  }
}
