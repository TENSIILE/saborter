/**
 * Type guard function that checks if a value is an AbortSignal.
 * This function uses the instanceof operator to determine if the value
 * is an instance of the AbortSignal class.
 *
 * @param {any} value - The value to check.
 * @returns {value is AbortSignal} Returns true if the value is an AbortSignal,
 *          false otherwise.
 *
 * @example
 * // Basic usage
 * const controller = new AbortController();
 * console.log(isAbortSignal(controller.signal)); // true
 * console.log(isAbortSignal({})); // false
 *
 * @example
 * // Using with type narrowing
 * function handleSignal(signal: unknown) {
 *   if (isAbortSignal(signal)) {
 *     // TypeScript now knows signal is AbortSignal
 *     console.log(signal.aborted);
 *   }
 * }
 */
export const isAbortSignal = (value: any): value is AbortSignal => {
  return value instanceof AbortSignal;
};
