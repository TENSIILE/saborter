import { ExtendedStackError } from '../extended-stack-error';
import { ABORT_ERROR_NAME } from './abort-error.constants';
import * as Types from './abort-error.types';

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
   * A field containing additional error information indicating the reason for the current error.
   */
  public cause?: Error;

  /**
   * field with the name of the error initiator.
   * @default `user`
   */
  public initiator?: Types.AbortInitiator;

  constructor(message: string, options?: Types.AbortErrorOptions) {
    super(message);

    this.name = ABORT_ERROR_NAME;

    this.type = options?.type || 'aborted';
    this.reason = options?.reason;
    this.cause = options?.cause;
    this.initiator = options?.initiator || 'user';

    this.expandStack();
  }

  protected override get debugStackInfo(): Record<string, any> {
    return {
      createdAt: new Date(this.timestamp).toISOString(),
      reason: this.reason,
      type: this.type,
      initiator: this.initiator
    };
  }
}
