import * as Constants from './state-observer.constants';
import { StateObserver } from './state-observer';
import { RequestState } from './state-observer.types';

export const emitRequestState = (instance: StateObserver, requestState: RequestState) => {
  instance[Constants.EMIT_METHOD_SYMBOL](requestState);
};

export const clearStateListeners = (instance: StateObserver) => {
  instance[Constants.CLEAR_METHOD_SYMBOL]();
};
