import * as Utils from './extended-stack-error.utils';

let isDebugErrorStackEnabled = false;

/**
 * Changes the error stack mode, enabling or disabling debug information.
 * @default false
 */
export const setDebugErrorStackMode = (enabled: boolean): void => {
  isDebugErrorStackEnabled = enabled;
};

export abstract class ExtendedStackError extends Error {
  protected abstract get debugStackInfo(): Record<string, any>;

  /**
   * Expands the stack with additional error information.
   */
  protected expandStack = (): void => {
    if (!isDebugErrorStackEnabled) return;

    this.stack += Utils.getDebugStackInfo(this.debugStackInfo);
  };
}
