import { Aborter } from './aborter';
import { disposeSymbol } from './aborter.constants';

/**
 * Clears the object's data completely: all subscriptions in all properties, clears overridden methods, state values.
 * @param aborter the Aborter instance
 */
export const dispose = (aborter: Aborter): void => {
  aborter[disposeSymbol]();
};
