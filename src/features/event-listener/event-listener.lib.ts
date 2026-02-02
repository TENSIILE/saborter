import { clearMethodSymbol } from './event-listener.constants';
import { EventListener } from './event-listener';

export const clearEventListeners = (instance: EventListener) => {
  instance[clearMethodSymbol]();
};
