export interface AbortErrorOptions {
  type?: 'cancelled' | 'aborted';
  reason?: any;
  cause?: any;
  signal?: AbortSignal;
  initiator?: AbortInitiator;
}

export type AbortInitiator = 'timeout' | 'user' | 'system';
