import { ABORT_ERROR_NAME } from './abort-error.constants';

interface AbortErrorOptions {
  type?: 'cancelled' | 'aborted';
  reason?: any;
  signal?: AbortSignal;
}

export class AbortError extends Error {
  /**
   * Interrupt error code.
   * @readonly
   */
  public readonly code: number = 20;

  /**
   * Interrupt type 'cancelled' | 'aborted'.
   * @default `aborted`
   */
  public type: AbortErrorOptions['type'];

  /**
   *The timestamp in milliseconds when the error was created.
   @readonly
   @returns Date.now();
   */
  public readonly timestamp = Date.now();

  /**
   * Additional reason or data associated with the interrupt.
   */
  public reason?: any;

  /**
   * AbortSignal that was just interrupted.
   */
  public signal?: AbortSignal;

  constructor(message: string, options?: AbortErrorOptions) {
    super(message);

    this.name = ABORT_ERROR_NAME;

    this.type = options?.type || 'aborted';
    this.reason = options?.reason;
    this.signal = options?.signal;
  }
}
