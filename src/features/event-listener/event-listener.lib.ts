import { CLEAR_METHOD_SYMBOL } from './event-listener.constants';
import { EventListener } from './event-listener';

export const clearEventListeners = (instance: EventListener) => {
  instance[CLEAR_METHOD_SYMBOL]();
};
