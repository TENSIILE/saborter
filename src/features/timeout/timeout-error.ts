import { ExtendedStackError } from '../extended-stack-error';

export interface TimeoutErrorOptions {
  /**
   * Time in milliseconds after which interrupts should be started.
   */
  ms: number;
  /**
   * A field that stores any metadata passed into the error.
   */
  reason?: any;
}

export class TimeoutError extends ExtendedStackError {
  /**
   *The timestamp in milliseconds when the error was created.
   @readonly
   @returns Date.now();
   */
  public readonly timestamp = Date.now();

  /**
   * A field displaying the time in milliseconds after which the request was interrupted.
   */
  public ms?: number;

  /**
   * A field storing the error reason. Can contain any metadata.
   */
  public reason?: any;

  constructor(message: string, options?: TimeoutErrorOptions) {
    super(message);

    this.ms = options?.ms;
    this.reason = options?.reason;

    this.expandStack();
  }

  protected override get additionalStackInfo(): Record<string, any> {
    return {
      timestamp: new Date(this.timestamp).toISOString(),
      ms: this.ms,
      reason: this.reason
    };
  }
}
