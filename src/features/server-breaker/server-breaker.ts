import * as Types from './server-breaker.types';
import { createAbortableHeaders } from './server-breaker.utils';

/**
 * Manages server‑side interruption notification for abortable requests.
 */
export class ServerBreaker {
  /**
   * Metadata storage for request‑related data (e.g., headers).
   * @protected
   */
  protected meta: Types.RequestMeta = {};

  constructor() {
    this.meta.headers = createAbortableHeaders();
  }

  /**
   * Disables the operation of the interrupter on the server.
   */
  public off = (): void => {
    this.meta.headers = {};
  };

  /**
   * Returns the request headers that should be sent with the abortable request.
   * Headers are only created if `interruptionsOnServer` is configured.
   *
   * @returns {Types.AbortableHeaders | undefined} - The headers object, or `undefined` if interruption is disabled.
   */
  public get headers(): Types.AbortableHeaders | undefined {
    return this.meta.headers;
  }
}
