import { RequestMeta, FetchableRequestHeaders } from './fetcher-factory.types';
import { generateUuid } from '../../shared/utils';

/**
 * Generates a unique request identifier by combining the URL and HTTP method.
 *
 * @param {RequestMeta} meta - The request metadata object.
 * @param {string} meta.url - The request URL.
 * @param {string} meta.method - The HTTP method (e.g., 'GET', 'POST').
 * @returns {string} A string in the format `{method}@{url}`.
 *
 * @example
 * const meta = { url: '/api/users', method: 'GET' };
 * const key = getRequestUrlByMeta(meta); // 'GET@/api/users'
 */
export const getRequestUrlByMeta = (meta: RequestMeta): string => {
  return `${meta.method}@${meta.url}`;
};

/**
 * Creates a set of headers to be sent with each request.
 * Includes a unique request ID and cache-control headers.
 *
 * @returns {Types.FetchableRequestHeaders} The headers object.
 */
export const createHeaders = (): FetchableRequestHeaders => {
  return { 'x-request-id': generateUuid(), 'Cache-Control': 'no-cache', Pragma: 'no-cache' };
};
