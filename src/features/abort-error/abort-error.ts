import { ExtendedStackError } from '../extended-stack-error';
import { ABORT_ERROR_NAME } from './abort-error.constants';
import * as Types from './abort-error.types';

/**
 * Represents an error that occurs when an operation is aborted or cancelled.
 * Extends `ExtendedStackError` to provide enhanced stack trace information.
 *
 * @class AbortError
 *
 * @example
 * // Create a simple abort error
 * const error = new AbortError('Operation was aborted');
 * console.log(error.name); // 'AbortError'
 * console.log(error.type); // 'aborted'
 * console.log(error.timestamp); // 1678901234567
 *
 * @example
 * // Create with full options
 * const error = new AbortError('Request timed out', {
 *   type: 'cancelled',
 *   reason: 'User navigation',
 *   metadata: { requestId: 123 },
 *   cause: new Error('Network error'),
 *   initiator: 'timeout'
 * });
 *
 * @example
 * // The error automatically expands the stack with debug info
 * console.log(error.stack);
 * // Includes serialized debugStackInfo in the stack trace
 */
export class AbortError extends ExtendedStackError {
  /**
   * Interrupt type 'cancelled' | 'aborted'.
   * @default `aborted`
   */
  public type: Types.AbortErrorOptions['type'];

  /**
   * The timestamp in milliseconds when the error was created.
   @readonly
   @returns Date.now();
   */
  public readonly timestamp = Date.now();

  /**
   * Additional reason or data associated with the interrupt.
   */
  public reason?: any;

  /**
   * Interrupt-related data. The best way to pass any data inside the error.
   * This field will not be overridden in any way.
   */
  public metadata?: any;

  /**
   * A field containing additional error information indicating the reason for the current error.
   */
  public cause?: Error;

  /**
   * Field with the name of the error initiator.
   * @default `user`
   */
  public initiator?: Types.AbortInitiator;

  constructor(message: string, options?: Types.AbortErrorOptions) {
    super(message);

    this.name = ABORT_ERROR_NAME;

    this.type = options?.type || 'aborted';
    this.reason = options?.reason;
    this.metadata = options?.metadata;
    this.cause = options?.cause;
    this.initiator = options?.initiator || 'user';

    this.expandStack();
  }

  /**
   * Provides additional debug information to be included in the expanded stack trace.
   *
   * @override
   * @returns {Record<string, any>} An object containing serializable debug data.
   * @protected
   */
  protected override get debugStackInfo(): Record<string, any> {
    return {
      createdAt: new Date(this.timestamp).toISOString(),
      reason: this.reason,
      type: this.type,
      initiator: this.initiator,
      metadata: this.metadata
    };
  }
}
