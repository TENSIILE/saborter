import { AbortableRequestOptions } from '../../../modules/aborter/aborter.types';

export interface SetTimeoutAsyncAbortableRequestOptions<
  Args extends [unknown?, ...unknown[]] = []
> extends AbortableRequestOptions {
  args: Args;
}
