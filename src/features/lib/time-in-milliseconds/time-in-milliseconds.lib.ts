/**
 * Configuration object for time values.
 * All properties are optional and default to 0 if not provided.
 */
interface TimeMsConfig {
  /**
   * @property {number} - Milliseconds component.
   */
  milliseconds?: number;
  /**
   * @property {number} - Seconds component (will be converted to milliseconds).
   */
  seconds?: number;
  /**
   * @property {number} - Minutes component (will be converted to milliseconds).
   */
  minutes?: number;
  /**
   * @property {number} - Hours component (will be converted to milliseconds).
   */
  hours?: number;
}

/**
 * Validates that all values in the array are either numbers or undefined.
 * This is an internal helper function used to ensure type safety.
 *
 * @param {(number | undefined)[]} values - Array of values to validate.
 * @returns {void}
 * @throws {TypeError} Throws a TypeError if any value is not a number or undefined.
 *
 * @private
 */
const throwErrorIfValuesNotMatchTyping = (values: (number | undefined)[]): never | void => {
  for (let i = 0; i < values.length; i++) {
    const el = values[i];

    if (typeof el === 'number' || typeof el === 'undefined') {
      continue;
    } else {
      throw new TypeError('Function values ​​are not numbers!');
    }
  }
};

// Time conversion constants
/** @const {number} SECOND_IN_MS - Milliseconds in one second. */
const SECOND_IN_MS = 1000;

/** @const {number} MINUTES_IN_MS - Milliseconds in one minute. */
const MINUTES_IN_MS = 60 * SECOND_IN_MS;

/** @const {number} HOURS_IN_MS - Milliseconds in one hour. */
const HOURS_IN_MS = 60 * MINUTES_IN_MS;

/**
 * Converts a time configuration object to total milliseconds.
 * Each time component is optional and defaults to 0.
 *
 * @param {TimeMsConfig} timeMsConfig - Configuration object with time components.
 * @returns {number} Total time in milliseconds.
 * @throws {TypeError} Throws if any time component is not a number.
 *
 * @example
 * // Basic usage
 * timeInMilliseconds({ seconds: 1 }); // Returns 1000
 * timeInMilliseconds({ minutes: 1, seconds: 30 }); // Returns 90000
 *
 * @example
 * // Using all components
 * timeInMilliseconds({
 *   hours: 1,
 *   minutes: 30,
 *   seconds: 45,
 *   milliseconds: 500
 * });
 */
export const timeInMilliseconds = (timeMsConfig: TimeMsConfig): number => {
  throwErrorIfValuesNotMatchTyping(Object.values(timeMsConfig));

  const { milliseconds = 0, seconds = 0, minutes = 0, hours = 0 } = timeMsConfig ?? {};

  const secondsMs = seconds * SECOND_IN_MS;
  const minutesMs = minutes * MINUTES_IN_MS;
  const hoursMs = hours * HOURS_IN_MS;

  return milliseconds + secondsMs + minutesMs + hoursMs;
};
