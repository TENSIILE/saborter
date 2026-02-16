/**
 * Represents the initiator or source of an abort operation.
 *
 * - `'timeout'`: Aborted due to a timeout.
 * - `'user'`: Aborted by user action (default).
 * - `'system'`: Aborted by the system (e.g., memory pressure, navigation).
 * - `{} & string`: An empty object type that accepts any string-based user identifier of the initiator.
 *
 * @example
 * const initiator: AbortInitiator = 'timeout';
 * const customInitiator: AbortInitiator = 'reactor';
 */
export type AbortInitiator = 'timeout' | 'user' | 'system' | ({} & string);

/**
 * Defines the kind of abort event.
 *
 * - `'cancelled'`: The operation was cancelled before completion (explicit cancellation).
 * - `'aborted'`: The operation was aborted due to an error or external signal (default).
 */
export type AbortType = 'cancelled' | 'aborted';

/**
 * Configuration options for creating an {@link AbortError}.
 */
export interface AbortErrorOptions {
  /**
   * Specifies whether the error represents a cancellation or an abort.
   * @default 'aborted'
   */
  type?: AbortType;
  /**
   * Additional human‑readable or programmatic reason for the abort.
   */
  reason?: any;
  /**
   * The original error that led to this abort, if any.
   */
  cause?: Error;
  /**
   * Identifies what caused the abort (user, system, timeout, or custom).
   *  @default 'user' in the `AbortError` constructor
   */
  initiator?: AbortInitiator;
  /**
   * Arbitrary structured data associated with the abort. Never overwritten.
   */
  metadata?: any;
}
