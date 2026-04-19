import { abortSignalAny } from '../abort-signal-any';
import { AborterType } from '../../../modules/aborter/aborter.types';

let executableAborter: AborterType | null = null;

let isAborterCtxProvisionToFetchEnabled = true;

const originalFetch = globalThis.fetch;

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
 * saveRunningAborterToContext(aborter);
 * // All subsequent `fetch` calls will use the aborter's signal and headers.
 */
export const saveRunningAborterToContext = (aborter: AborterType | null): void => {
  if (!isAborterCtxProvisionToFetchEnabled) {
    return;
  }

  if (!aborter) {
    if (globalThis.fetch !== originalFetch) {
      globalThis.fetch = originalFetch;
    }

    executableAborter = null;
  } else {
    executableAborter = aborter;

    if (globalThis.fetch !== internalFetch) {
      globalThis.fetch = internalFetch;
    }
  }
};

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
  saveRunningAborterToContext(null);

  if (!('requestOptions' in aborter)) {
    throw new ReferenceError('The field with the request options for the method "try" was not found!');
  }

  const { headers } = ('requestOptions' in aborter ? (aborter['requestOptions'] ?? {}) : {}) as Record<'headers', {}>;

  return globalThis.fetch(url, {
    ...init,
    signal: abortSignalAny(init?.signal, aborter.signal),
    headers: { ...init?.headers, ...headers }
  });
}

/**

* Enables or disables automatic provisioning of the active `Aborter` context for `fetch` calls. 
* If enabled, `Aborter.try` calls will override the global `fetch` only at the time of the call and 
* if the user chooses to pass the context automatically. 
*
* After the `fetch` call, the context is immediately restored to the original one. 
* The `fetch` override occurs only in the scope of the `Aborter.try` method. 
*
* If disabled, the original `fetch` is always used, and interception does not occur.

* @param enabled - `true` to enable context provisioning, `false` to disable.

* @example
* // Temporarily disables interception

* setAborterContextProvisionToFetchMode(false);

* // All fetch calls will use their own implementation
*/
export const setAborterContextProvisionToFetchMode = (enabled: boolean): void => {
  isAborterCtxProvisionToFetchEnabled = enabled;
};
