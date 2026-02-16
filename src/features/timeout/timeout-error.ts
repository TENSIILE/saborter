import { ExtendedStackError } from '../extended-stack-error';

/**
 * Options for configuring a {@link TimeoutError}.
 */
export interface TimeoutErrorOptions {
  /**
   * Time in milliseconds after which interrupts should be started.
   */
  ms: number;
  /**
   * The field that stores the reason for this error.
   */
  reason?: any;
  /**
   * A field that stores any metadata passed into the error.
   * This field will not be overridden in any way.
   */
  metadata?: any;
}

/**
 * Represents an error that occurs when an operation times out.
 *
 * Extends `ExtendedStackError` to include enhanced stack trace information
 * and additional debug metadata.
 *
 * @class TimeoutError
 *
 * @example
 * // Create a simple timeout error
 * const error = new TimeoutError('Request timed out');
 * console.log(error.ms);       // undefined
 * console.log(error.reason);   // undefined
 * console.log(error.metadata); // undefined
 *
 * @example
 * // Create with full options
 * const error = new TimeoutError('API timeout', {
 *   ms: 5000,
 *   reason: 'Request timed out',
 *   metadata: { url: '/api/data' },
 * });
 * console.log(error.ms);       // 5000
 * console.log(error.reason);   // 'Request timed out'
 * console.log(error.metadata); // { url: '/api/data' }
 */
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

  /**
   * Interrupt-related data. The best way to pass any data inside the error.
   * This field will not be overridden in any way.
   */
  public metadata?: any;

  constructor(message: string, options?: TimeoutErrorOptions) {
    super(message);

    this.ms = options?.ms;
    this.reason = options?.reason;
    this.metadata = options?.metadata;

    this.expandStack();
  }

  /**
   * Provides additional debug information to be included in the expanded stack trace.
   *
   * @override
   * @returns {Record<string, any>} An object containing serializable debug data.
   *
   * @protected
   */
  protected override get debugStackInfo(): Record<string, any> {
    return {
      createdAt: new Date(this.timestamp).toISOString(),
      ms: this.ms,
      reason: this.reason,
      metadata: this.metadata
    };
  }
}
