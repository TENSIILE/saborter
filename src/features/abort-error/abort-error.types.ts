export type AbortInitiator = 'timeout' | 'user' | 'system' | {};

export type AbortType = 'cancelled' | 'aborted';

export interface AbortErrorOptions {
  type?: AbortType;
  reason?: any;
  cause?: Error;
  initiator?: AbortInitiator;
}
