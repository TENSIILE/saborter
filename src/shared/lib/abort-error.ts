import { ABORT_ERROR_NAME } from '../constants';

export class AbortError extends Error {
  public code: number;
  public isCancelled: boolean;

  constructor(message: string, options?: { isCancelled: boolean }) {
    super(message);

    const abortErrorInstance = new DOMException(message, ABORT_ERROR_NAME);

    this.code = abortErrorInstance.ABORT_ERR;
    this.name = abortErrorInstance.name;

    this.isCancelled = options?.isCancelled ?? false;
  }
}
