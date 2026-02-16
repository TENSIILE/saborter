/* eslint-disable no-console */
// @ts-ignore
import packageJson from '../../package.json';

let isLoggerEnabled = false;
let isInfoSkip = false;

/**
 * Sets the global Saborter logging mode for the application.
 *
 * This function updates the internal flags that control whether logging is enabled
 * and whether `info` level logs should be skipped. These flags are used by other
 * parts of the logging system (not shown here) to determine whether to output
 * log messages.
 *
 * @param {boolean} enabled - If `true`, enables logging globally; if `false`, disables it.
 * @param {Object} [options] - Optional settings.
 * @param {boolean} [options.skipInfo=false] - If `true`, `info` level logs will be suppressed
 *        even when logging is enabled. If `false`, `info` logs are allowed.
 *
 * @example
 * // Enable logging but skip info messages
 * setLoggerMode(true, { skipInfo: true });
 *
 * @example
 * // Disable all logging
 * setLoggerMode(false);
 */
export const setLoggerMode = (enabled: boolean, options?: { skipInfo?: boolean }): void => {
  isLoggerEnabled = enabled;
  isInfoSkip = !!options?.skipInfo;
};

const infoStyle = `
  display: inline-block;
  padding-left: 0.2em;
  padding-right: 0.2em;
  border-radius: 0.125rem;
  background-color: #aecff7;
  color: #060c41;
`;

class Logger {
  public warn = (message: string, ...args: any[]): void => {
    if (!isLoggerEnabled) return;

    console.warn(`[${packageJson.name}]: ${message}`, ...args);
  };

  public info = (message: string, ...args: any[]): void => {
    if (!isLoggerEnabled || isInfoSkip) return;

    console.debug(`%c [${packageJson.name}]: ${message}`, infoStyle, ...args);
  };
}

export const logger = new Logger();
