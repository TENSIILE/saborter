/**
 * Headers sent with every abortable fetch request.
 * Includes a unique request ID and cache-control headers.
 */
export interface RequestHeaders extends Record<string, string> {
  /**
   * Unique identifier for the request, generated on the client.
   */
  'x-request-id': string;
  /**
   * Disables caching.
   */
  'Cache-Control': 'no-cache';
  /**
   * Disables caching for HTTP/1.0.
   */
  Pragma: 'no-cache';
}

/**
 * Metadata describing a request.
 */
export interface RequestMeta {
  /**
   * Headers used in the request.
   */
  headers?: RequestHeaders;
}

/**
 * Configuration for notifying the server when a request is interrupted.
 */
export interface InterruptionsOnServer {
  /**
   *  Base path of the server (e.g., `window.location.origin`).
   */
  baseURL?: string;
  /**
   * Endpoint path where the interruption notification is sent.
   * @default "api/@cancel"
   */
  endpointName?: string;
}

export interface ServerBreakerOptions {
  /**
   * Configuration for server interruption notifications.
   */
  interruptionsOnServer?: boolean | InterruptionsOnServer;
}
