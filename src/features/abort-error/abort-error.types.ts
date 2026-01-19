export type AbortInitiator = 'timeout' | 'user' | 'system';

export interface AbortErrorOptions {
  type?: 'cancelled' | 'aborted';
  reason?: any;
  cause?: any;
  signal?: AbortSignal;
  initiator?: AbortInitiator;
}
