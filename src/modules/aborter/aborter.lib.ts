import { disposeSymbol } from './aborter.constants';

/**
 * Clears the object's data completely: all subscriptions in all properties, clears overridden methods, state values.
 * @param object an object that supports resource cleaning
 */
export const dispose = (object: any): void => {
  const cleanup = object[disposeSymbol];

  if (!cleanup) {
    throw new ReferenceError(`${disposeSymbol.toString()} does not exist in the current object`);
  }

  cleanup();
};
