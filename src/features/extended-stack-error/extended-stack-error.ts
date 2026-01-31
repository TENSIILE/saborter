import * as Utils from './extended-stack-error.utils';

let isStackExtensible = true;
let originalStack: string | undefined;

export abstract class ExtendedStackError extends Error {
  protected abstract get debugStackInfo(): Record<string, any>;

  constructor(message: string) {
    super(message);

    originalStack = this.stack;
  }

  /**
   * Expands the stack with additional error information.
   */
  protected expandStack = (): void => {
    if (isStackExtensible) {
      this.stack += Utils.getDebugStackInfo(this.debugStackInfo);
    } else {
      this.stack = originalStack;
    }
  };

  /**
   * Restores the stack to default.
   */
  public static restoreStack(): void {
    isStackExtensible = false;
  }
}
