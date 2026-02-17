import * as Constants from './state-observer.constants';
import { StateObserver } from './state-observer';
import { RequestState } from './state-observer.types';

/**
 * Calls a private method on the instance to notify listeners that a state change has occurred.
 */
export const emitRequestState = (instance: StateObserver, requestState: RequestState): void => {
  instance[Constants.emitMethodSymbol](requestState);
};

/**
 * Calls a private instance method to clear all listeners and data.
 */
export const clearStateListeners = (instance: StateObserver): void => {
  instance[Constants.clearMethodSymbol]();
};
