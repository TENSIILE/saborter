import { RequestHeaders } from './server-breaker.types';
import { generateUuid } from '../../shared/utils';

/**
 * Creates a set of headers to be sent with each request.
 * Includes a unique request ID and cache-control headers.
 *
 * @returns {RequestHeaders} The headers object.
 */
export const createHeaders = (): RequestHeaders => {
  return { 'x-request-id': generateUuid(), 'Cache-Control': 'no-cache', Pragma: 'no-cache' };
};
