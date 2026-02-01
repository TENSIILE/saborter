import * as Utils from './extended-stack-error.utils';

interface StackConfig {
  isExtensible: boolean;
  originalStack?: string;
}

const stacks = new Map<string, StackConfig>();
let isDebugErrorStackDisabled = false;

export const disableDebugErrorStack = (): void => {
  isDebugErrorStackDisabled = true;
};

export const addDebugErrorStack = (errorName: string): void => {
  stacks.set(errorName, { isExtensible: true });
};

export abstract class ExtendedStackError extends Error {
  protected abstract get debugStackInfo(): Record<string, any>;

  /**
   * Expands the stack with additional error information.
   */
  protected expandStack = (): void => {
    if (isDebugErrorStackDisabled) return;

    const stack = stacks.get(this.constructor.name);

    if (!stack) return;

    stack.originalStack = this.stack;

    if (stack.isExtensible) {
      this.stack += Utils.getDebugStackInfo(this.debugStackInfo);
    } else {
      this.stack = stack.originalStack || this.stack;
    }
  };

  /**
   * Restores the stack to default.
   */
  public static restoreStack = (): void => {
    stacks.delete(this.constructor.name);
  };
}
