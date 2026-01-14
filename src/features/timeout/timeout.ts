export class Timeout {
  private timeoutId?: NodeJS.Timeout | number;

  /**
   * Sets the timeout for the current request.
   */
  public setTimeout = (timeout: number | undefined, onAbort: VoidFunction): void => {
    this.clearTimeout();

    if (!timeout || timeout <= 0) return;

    this.timeoutId = setTimeout(onAbort, timeout);
  };

  /**
   * Clears the set timeout.
   */
  public clearTimeout = (): void => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  };
}
