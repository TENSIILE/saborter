import * as Types from './server-breaker.types';
import { createHeaders } from './server-breaker.utils';
import * as Constants from './server-breaker.constants';

/**
 * Manages server‑side interruption notification for abortable requests.
 */
export class ServerBreaker {
  /**
   * Configuration for server interruption notification.
   *
   * @protected
   */
  protected interruptionsOnServer?: Types.InterruptionsOnServer;

  /**
   * Metadata storage for request‑related data (e.g., headers).
   * @protected
   */
  protected meta: Types.RequestMeta = {};

  constructor(options?: Types.ServerBreakerOptions) {
    this.setInterruptionsOnServer(options?.interruptionsOnServer);
  }

  /**
   * Configures the server interruption settings based on the provided value.
   * Only runs in a browser environment (`window` exists).
   *
   * @private
   * @param {Types.ServerBreakerOptions['interruptionsOnServer']} interruptionsOnServer -
   *        The configuration value from the constructor options.
   */
  private setInterruptionsOnServer = (interruptionsOnServer: Types.ServerBreakerOptions['interruptionsOnServer']) => {
    if (typeof window === 'undefined' || !interruptionsOnServer) {
      return;
    }

    const { baseURL = window.location.origin, endpointName = Constants.ENDPOINT_NAME } =
      typeof interruptionsOnServer === 'object' ? interruptionsOnServer : {};

    this.interruptionsOnServer = { baseURL, endpointName };
    this.meta.headers = createHeaders();
  };

  /**
   * Returns the request headers that should be sent with the abortable request.
   * Headers are only created if `interruptionsOnServer` is configured.
   *
   * @returns {Types.RequestHeaders | undefined} - The headers object, or `undefined` if interruption is disabled.
   */
  public get headers(): Types.RequestHeaders | undefined {
    return this.meta.headers;
  }

  /**
   * Notifies the server that a request was interrupted (e.g., because the user navigated away).
   * This method sends the request ID (from the last request) to a server endpoint.
   */
  public notifyServerOfInterruption = (): void => {
    if (this.interruptionsOnServer) {
      const url = `${this.interruptionsOnServer.baseURL}${this.interruptionsOnServer.endpointName}`;

      const blob = new Blob([this.headers?.[Constants.X_REQUEST_ID_HEADER] ?? ''], { type: 'text/plain' });

      if (navigator && 'sendBeacon' in navigator && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(url, blob);

        return;
      }

      fetch(url);
    }
  };
}
