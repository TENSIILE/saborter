import { AttractListeners, ReusableAborterProps } from './reusable-aborter.types';
import { logger } from '../../shared';

/**
 * Evaluates whether a particular type of listener should be attracted (synchronized)
 * based on the `attractListeners` configuration.
 *
 * @param {ReusableAborterProps['attractListeners']} attractListeners -
 *   The configuration value, which can be `undefined`, a boolean, or an {@link AttractListeners} object.
 * @param {keyof AttractListeners} targetName -
 *   The listener type to check (e.g., `'eventListeners'` or `'onabort'`).
 * @returns {boolean} - `true` if the specified listener type should be attracted, otherwise `false`.
 *
 * @example
 * // Global enable
 * canAttractListeners(true, 'onabort'); // true
 *
 * @example
 * // Global disable
 * canAttractListeners(false, 'eventListeners'); // false, logs that attraction is completely disabled
 *
 * @example
 * // Selective enable
 * canAttractListeners({ eventListeners: true, onabort: false }, 'onabort'); // false, logs that sync disabled for 'onabort'
 */
export const canAttractListeners = (
  attractListeners: ReusableAborterProps['attractListeners'],
  targetName: keyof AttractListeners
) => {
  if (!attractListeners) {
    logger.info('ReusableAborter -> Synchronization of listeners of the signal abortion was completely disabled');

    return false;
  }

  if (attractListeners === true) {
    return true;
  }

  const result = typeof attractListeners !== 'boolean' && attractListeners[targetName];

  if (!result) {
    logger.info(`ReusableAborter -> Listener sync was disabled for "${targetName}"`);
  }

  return result;
};
