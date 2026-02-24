export type PromiseReject = (reason?: any) => void;

export type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;

export type PromiseExecutor<T> = (resolve: PromiseResolve<T>, reject: PromiseReject) => void;
