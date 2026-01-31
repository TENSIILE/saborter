import * as Constants from './state-observer.constants';
import { StateObserver } from './state-observer';
import { RequestState } from './state-observer.types';

export const emitRequestState = (instance: StateObserver, requestState: RequestState) => {
  instance[Constants.emitMethodSymbol](requestState);
};

export const clearStateListeners = (instance: StateObserver) => {
  instance[Constants.clearMethodSymbol]();
};
