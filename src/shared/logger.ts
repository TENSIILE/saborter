/* eslint-disable no-console */
// @ts-ignore
import packageJson from '../../package.json';

class Logger {
  public warn = (message: string, ...args: any[]): void => {
    console.warn(`[${packageJson.name}]: ${message}`, ...args);
  };

  public info = (message: string, ...args: any[]): void => {
    console.debug(`[${packageJson.name}]: ${message}`, ...args);
  };
}

export const logger = new Logger();
