import { disposeSymbol } from './aborter.constants';

/**
 * Clears the object's data completely: all subscriptions in all properties, clears overridden methods, state values.
 * @param aborter the Aborter instance
 */
export const dispose = (object: any): void => {
  const cleanup = object[disposeSymbol];

  if (!cleanup) {
    throw new TypeError(`${disposeSymbol.toString()} does not exist in the current object`);
  }

  cleanup();
};
