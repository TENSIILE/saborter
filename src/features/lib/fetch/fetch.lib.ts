/* eslint-disable no-use-before-define */
import { abortSignalAny } from '../abort-signal-any';
import { AborterType } from '../../../modules/aborter/aborter.types';

let executableAborter: AborterType | null = null;

let isAborterCtxProvisionEnabled = false;

const originalFetch = globalThis.fetch;

const OriginalXHR = globalThis.XMLHttpRequest;

/**
 * Saves the currently active `Aborter` instance to a module‑level variable.
 * When an aborter is provided, the global `fetch` is replaced with an internal
 * wrapper that automatically injects the aborter's signal and headers.
 * When `null` is passed, the original `fetch` is restored.
 *
 * This function is used internally by the fetch interception mechanism.
 *
 * @param aborter - The `Aborter` instance to use for subsequent `fetch` calls,
 *                  or `null` to disable interception.
 *
 * @example
 * const aborter = new Aborter();
 * injectAborterContextIntoHttpRequest(aborter);
 * // All subsequent `fetch` calls will use the aborter's signal and headers.
 */
export function injectAborterContextIntoHttpRequest(aborter: AborterType | null): void {
  if (!isAborterCtxProvisionEnabled) {
    return;
  }

  if (!aborter) {
    if (globalThis.fetch !== originalFetch) {
      globalThis.fetch = originalFetch;
    }

    if (globalThis.XMLHttpRequest !== OriginalXHR) {
      globalThis.XMLHttpRequest = OriginalXHR;
    }

    executableAborter = null;
  } else {
    executableAborter = aborter;

    if (globalThis.fetch !== internalFetch) {
      globalThis.fetch = internalFetch;
    }

    if (globalThis.XMLHttpRequest !== ProvisionXMLHttpRequest) {
      globalThis.XMLHttpRequest = ProvisionXMLHttpRequest;
    }
  }
}

/**
 * Retrieves abortable request headers from an `Aborter` instance.
 *
 * If the aborter has a `requestOptions` property containing `headers`, those headers are returned.
 * Otherwise, an empty object is returned.
 *
 * @param {AborterType} aborter - The Aborter instance.
 * @returns {Record<string, string>} Headers object (may be empty).
 */
const getAbortableHeaders = (aborter: AborterType): Record<string, string> => {
  if (!('requestOptions' in aborter)) {
    throw new ReferenceError('The field with the request options for the method "try" was not found!');
  }

  const { headers } = ('requestOptions' in aborter ? (aborter['requestOptions'] ?? {}) : {}) as Record<'headers', {}>;

  return headers;
};

/**
 * Proxied `XMLHttpRequest` constructor that automatically injects abort‑related headers
 * and aborts the request when the active `Aborter` signals an abort.
 *
 * @this {XMLHttpRequest}
 * @returns {XMLHttpRequest} An `XMLHttpRequest` instance (original or proxied).
 *
 * @example
 * // Setup (once)
 * import { injectAborterContextIntoHttpRequest } from './fetch.lib';
 * import { Aborter } from './aborter';
 *
 * const aborter = new Aborter();
 * injectAborterContextIntoHttpRequest(aborter);
 *
 * // Any XHR created after this point will use the aborter
 * const xhr = new XMLHttpRequest();
 * xhr.open('GET', '/api/data');
 * xhr.send();
 *
 * // Later, abort the request
 * aborter.abort();
 */
const ProvisionXMLHttpRequest = function (this: XMLHttpRequest): globalThis.XMLHttpRequest {
  if (!executableAborter) {
    return new OriginalXHR();
  }

  const aborter = executableAborter;

  // Clear the aborter so that each request uses its own instance
  injectAborterContextIntoHttpRequest(null);

  const instance = new OriginalXHR();

  const originalOpen = instance.open;

  instance.open = function (...args: Parameters<typeof originalOpen>) {
    originalOpen.apply(instance, args);

    const headers = getAbortableHeaders(aborter);

    Object.entries(headers).forEach(([name, value]) => {
      instance.setRequestHeader(name, value);
    });
  } as typeof originalOpen;

  const unsubscribe = aborter.listeners.addEventListener(
    'aborted',
    () => {
      instance.abort();
    },
    { once: true }
  );

  instance.addEventListener('loadend', unsubscribe, { once: true });

  return instance;
} as unknown as typeof XMLHttpRequest;

Object.assign(ProvisionXMLHttpRequest, OriginalXHR);
ProvisionXMLHttpRequest.prototype = OriginalXHR.prototype;

/**
 * Internal fetch wrapper that automatically injects an active `Aborter`'s signal
 * and request headers into every `fetch` call.
 *
 * If no `executableAborter` is set, the original `fetch` is called directly.
 * Otherwise, the aborter is cleared immediately (to prevent reusing the same
 * aborter for subsequent requests).
 *
 * @param url - The request URL.
 * @param init - Optional `fetch` options.
 * @returns A `Promise` resolving to the `Response` object.
 */
export function internalFetch(url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (!executableAborter) {
    return globalThis.fetch(url, init);
  }

  const aborter = executableAborter;

  // Clear the aborter so that each request uses its own instance
  injectAborterContextIntoHttpRequest(null);

  const headers = getAbortableHeaders(aborter);

  return globalThis.fetch(url, {
    ...init,
    signal: abortSignalAny(init?.signal, aborter.signal),
    headers: { ...init?.headers, ...headers }
  });
}

/**

* Enables or disables automatic provisioning of the active `Aborter` context for `fetch | XMLHttpRequest` calls. 
* If enabled, `Aborter.try` calls will override the global `fetch | XMLHttpRequest` only at the time of the call and 
* if the user chooses to pass the context automatically. 
*
* After the `fetch | XMLHttpRequest` call, the context is immediately restored to the original one. 
* The `fetch | XMLHttpRequest` override occurs only in the scope of the `Aborter.try` method. 
*
* If disabled, the original `fetch | XMLHttpRequest` is always used, and interception does not occur.

* @param enabled - `true` to enable context provisioning, `false` to disable.
*/
export const setAborterContextProvisionMode = (enabled: boolean): void => {
  isAborterCtxProvisionEnabled = enabled;
};
