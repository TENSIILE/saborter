import * as Utils from './extended-stack-error.utils';

let isDebugErrorStackDisabled = false;

/**
 * Restores the stack to default values, disabling debug information.
 */
export const disableDebugErrorStack = (): void => {
  isDebugErrorStackDisabled = true;
};

export abstract class ExtendedStackError extends Error {
  protected abstract get debugStackInfo(): Record<string, any>;

  /**
   * Expands the stack with additional error information.
   */
  protected expandStack = (): void => {
    if (isDebugErrorStackDisabled) return;

    this.stack += Utils.getDebugStackInfo(this.debugStackInfo);
  };
}
