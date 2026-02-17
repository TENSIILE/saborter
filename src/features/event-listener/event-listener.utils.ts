import { clearMethodSymbol } from './event-listener.constants';
import { EventListener } from './event-listener';

/**
 * Сalls a private instance method to clear all listeners and data.
 */
export const clearEventListeners = (instance: EventListener): void => {
  instance[clearMethodSymbol]();
};
