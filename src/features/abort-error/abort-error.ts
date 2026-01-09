import { ABORT_ERROR_NAME } from './abort-error.constants';

interface AbortErrorOptions {
  type?: 'cancelled' | 'aborted';
  reason?: any;
}

export class AbortError extends Error {
  public code: number;

  public type: AbortErrorOptions['type'];

  public timestamp = Date.now();

  public reason?: any;

  constructor(message: string, options?: AbortErrorOptions) {
    super(message);

    const abortErrorInstance = new DOMException(message, ABORT_ERROR_NAME);

    this.code = abortErrorInstance.ABORT_ERR;
    this.name = abortErrorInstance.name;

    this.type = options?.type || 'aborted';
    this.reason = options?.reason;
  }
}
