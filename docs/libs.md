# Documentation for library functions

## 📖 Overview

This is an overview of the helper functions available in the package. These utilities are designed to simplify working with `AbortSignal`, `debouncing`, `timeouts`, and time conversions.

The functions below are based on the [AbortError](./abort-error.md) class. It is used to provide consistent and informative error objects when an operation is aborted.

## 🔧 API

### Import

```javascript
import { isAbortError, debounce } from 'saborter/lib';
```

### `isAbortError`

A type guard function that determines whether a given error is an `AbortError`. It uses multiple heuristics to identify abort errors, including checking the error's type, its `name` property, its message content, and recursively examining the error's `cause` chain.

**Parameters:**

- `error: any` - The value to check.

**Returns:**

`error is Error` - type guard.

Returns `true` if the value is identified as an AbortError, otherwise `false`. When `true`, TypeScript narrows the type to `Error`.

**Description:**

The function performs the following checks in order:

1. **Instance check:** If `error` is an instance of `AbortError`, it returns `true`.
2. **Name property check:** If `error` is an object and has a `name` property equal to `'AbortError'`, it returns `true`.
3. **Message substring check:** If `error` has a `message` property that contains the substring `'abort'`, it returns `true`. This matches common error messages like "The operation was aborted".
4. **Cause chain check:** It recursively checks the error's `cause` property (if any). If any error in the cause chain satisfies one of the above conditions, it returns `true`.

If none of these checks pass, it returns `false`.

This lenient approach ensures that various representations of abort errors (e.g., standard `AbortError` instances, plain objects, or errors with a nested cause) are correctly identified, making it useful in environments where the exact error class may not be available or where errors are wrapped.

> [!IMPORTANT]
>
> - The method will return `true` even if it receives a native AbortError that is thrown by the `DOMException` itself, or finds a hint of a request abort in the error message.
> - To exclusively verify that the error is an `AbortError` from the `saborter` package, it is better to use: `error instance AbortError`

**Examples:**

#### Direct instance:

```typescript
const abortError = new AbortError('Aborted');
isAbortError(abortError); // true
```

#### Object with correct name:

```typescript
const fakeAbort = { name: 'AbortError', message: 'Cancelled' };
isAbortError(fakeAbort); // true
```

#### Error with message containing 'abort':

```typescript
const error = new Error('The operation was aborted');
isAbortError(error); // true
```

#### Error with cause chain:

```typescript
const inner = new AbortError('Inner abort');
const outer = new Error('Wrapper', { cause: inner });
isAbortError(outer); // true
```

#### Non-abort errors:

```typescript
const regularError = new Error('Something went wrong');
isAbortError(regularError); // false

const nullValue = null;
isAbortError(nullValue); // false
```

### `catchAbortError`

This function catches errors that are `AbortError`'s and ignores them, while re‑throwing any other error. It is useful in scenarios where you want to handle abort errors silently (e.g., because they are expected and you don't need to act on them) but still propagate genuine errors.

**Parameters:**

- `error: any` - The error object to inspect.
- `options?: Object` - Configuration options.
  - `strict?: boolean` (Default `false`) - If `true`, the function uses `error instanceof AbortError` to identify an abort error. If `false`, it uses the more lenient `isAbortError` check (which may also recognize custom abort errors).

**Returns:**

`void | never`

- `void` if the error is an `AbortError` (the function does nothing, effectively silencing it).
- `never` – throws the original error if it is not an `AbortError`.

**Example:**

```typescript
try {
  await fetchWithTimeout(url, { signal });
} catch (error) {
  catchAbortError(error); // Non‑abort errors are re‑thrown; abort errors are ignored.
  // If execution reaches this point, it means the error was an AbortError and we can ignore it.
}
```

### `debounce`

Creates a debounced function that delays invoking the provided handler until after a specified timeout has elapsed since the last call. This is a leading‑edge debounce – the first call in a burst schedules the execution, and subsequent calls reset the timer. The debounced function accepts an `AbortSignal` and returns a promise that resolves with the handler's result or rejects if the handler throws or the signal is aborted.

**Parameters:**

- `handler: <R>(signal: AbortSignal) => R | Promise<R>` - A function that takes an `AbortSignal` and returns a value or a `Promise`. This is the function to debounce.
- `delay?: number` - The debounce delay in milliseconds. If not provided, the handler may be invoked immediately (depending on the underlying `setTimeoutAsync`).

**Returns:**

`(signal: AbortSignal) => R | Promise<R>`

A function that accepts an `AbortSignal` and returns a `Promise<R>`, where `R` is the return type of the handler.

**Error handling:**

- If the underlying `setTimeoutAsync` throws an `AbortError`, the error is enriched with a cause (a new `AbortError` containing the original error) and its `initiator` property is set to `'debounce'` before being re‑thrown.
- Any other error is re‑thrown unchanged.

**Examples:**

```typescript
const debouncedFetch = debounce((signal) => fetch('/api/search', { signal }), 300);

const controller = new AbortController();
debouncedFetch(controller.signal)
  .then((response) => response.json())
  .catch((err) => {
    if (err instanceof AbortError) {
      console.log('Debounced call aborted by:', err.initiator); // 'debounce'
    }
  });
```

#### You can also use `debounce` in conjunction with `Aborter` to delay the request for a while:

```typescript
const data = await aborter.try(debounce((signal) => fetch('/api/data', { signal }), 300));
```

### `isAbortSignal`

A type guard that checks whether a given value is an instance of `AbortSignal`.

**Parameters:**

- `value: any` - The value to test.

**Returns:**

`boolean` – `true` if the value is an `AbortSignal`, `false` otherwise.

**Example:**

```typescript
const controller = new AbortController();
console.log(isAbortSignal(controller.signal)); // true
console.log(isAbortSignal({})); // false
```

### `rethrowAbortError`

This function is the complement of `catchAbortError`. It re‑throws the error only if it is an `AbortError`; otherwise, it does nothing. This is useful in error‑handling patterns where you want to let abort errors propagate (so they can be caught elsewhere) while handling other errors locally.

**Parameters:**

- `error: any` - The error to inspect.
- `options?: Object`:
  - `strict?: boolean` (default `false`) - If `true`, uses `error instanceof AbortError`. If `false`, uses the more lenient `isAbortError` check.

**Returns:**

`void | never`

- `void` if the error is not an `AbortError`.
- `never` – throws the original error if it is an `AbortError`.

**Example:**

```typescript
try {
  await someOperation(signal);
} catch (error) {
  rethrowAbortError(error); // Only re‑throws if it's an abort error.
  // Handle other errors here.
}
```

### `setTimeoutAsync`

Schedules the execution of a handler (either a function or a string of code) after a specified delay. The operation can be cancelled using an `AbortSignal`. This function returns a promise that resolves with the handler's result or rejects if the timeout is aborted or if the handler throws an error.

**Parameters:**

- `handler: string | ((signal: AbortSignal) => T | Promise<T>)`: Can be either:
  - A string of code to evaluate (similar to the first argument of `setTimeout`).
  - A function that accepts an `AbortSignal` and returns a value or a `Promise`. This function will be called with the signal to allow cleanup on abort.
- `delay?: number` - The time in milliseconds to wait before executing the handler. If omitted, the handler is scheduled without a delay (i.e., as soon as possible).
- `options?: Object`:
  - `signal?: AbortSignal` - An `AbortSignal` that can be used to cancel the timeout. If not provided, a new `AbortController` is created internally.
  - `args?: any[]` - Arguments to pass to the handler.

**Returns:**

`Promise<T>` – resolves with the handler's result, or rejects with an `AbortError` if the operation was aborted, or with any error thrown by the handler.

**Behavior:**

- If the provided signal is already aborted when `setTimeoutAsync` is called, it immediately rejects with an `AbortError`.
- When the `handler` is a function, it is called with the signal. If the function returns a promise, the promise is chained; otherwise, the return value is used directly.
- If the `signal` is `aborted` after the timeout has been set, the timeout is cleared and the promise rejects with an `AbortError`. The error includes the original signal reason and the initiator is set to `'setTimeoutAsync'`.

**Examples:**

```typescript
const controller = new AbortController();
setTimeoutAsync((signal) => {
    return fetch('/api/data', { signal }).then((res) => res.json();
}), 5000, {
  signal: controller.signal
})
  .then((data) => console.log(data))
  .catch((error) => console.log(error.name)); // 'AbortError' if aborted
```

#### Option for working with `try-catch` syntax:

```typescript
const controller = new AbortController();
try {
  const data = await setTimeoutAsync(
    async (signal) => {
      const response = fetch('/api/data', { signal });
      return await response.json();
    },
    5000,
    { signal: controller.signal }
  );
} catch (error) {
  console.log(error.name); // 'AbortError' if aborted
}
```

#### The `setTimeoutAsync` function can be used as a delay function if you need it:

```typescript
const delay = (ms: number) => setTimeoutAsync('', ms);

console.log('Hello');
await delay(2000);
console.log('World');
```

#### The `setTimeoutAsync` function can be used like a regular native `setTimeout` function, but instead of returning an ID for deletion from the EventLoop, it returns the values ​​you returned from the callback:

```typescript
// Getting a token from local storage in 5 seconds
const token = await setTimeoutAsync(() => localStorage.getItem('token'), 5000); // string | null
```

#### To interrupt the function, we use the `AbortSignal`:

```typescript
const controller = new AbortController();
// Or you can use an ReusableAborter
try {
  const token = await setTimeoutAsync(
    () => {
      return localStorage.getItem('token');
    },
    5000,
    { signal: controller.signal }
  );
} catch (error) {
  if (isAbortError(error)) {
    console.log(error.name); // 'AbortError'
  }
}
```

### `throwIfAborted`

A utility that checks whether an `AbortSignal` has been aborted. If the signal is aborted, it throws an `AbortError`. This is useful for manual abortion checks inside long‑running operations that do not automatically handle the signal.

**Parameters:**

- `signal: AbortSignal` - The signal to check.

**Returns:**

`void | never`

- `void` if the signal is not aborted.
- `never` – throws an `AbortError` if the signal is aborted.

**Behavior:**

- If the signal's `reason` is already an instance of `AbortError`, that exact error is thrown (preserving its cause and initiator).
- Otherwise, a new AbortError is created with a default message and the original reason attached. The initiator is set to `'throwIfAborted'`.

**Example:**

```typescript
const processItems = (items: unknown[], signal: AbortSignal) => {
  try {
    for (const item of items) {
      throwIfAborted(signal); // Check before each iteration
      // Process item...
    }
  } catch (error) {
    // Handle error
  }
};
```

### `timeInMilliseconds`

Converts a configuration object containing time components (hours, minutes, seconds, milliseconds) into a total number of milliseconds. All components are optional and default to `0` if not provided.

**Parameters:**

- `timeMsConfig: Object` - An object with the following optional numeric properties:
  - `hours?: number` - hours to add.
  - `minutes?: number` - minutes to add.
  - `seconds?: number` - seconds to add.
  - `milliseconds?: number` - milliseconds to add.

**Returns:**

`number` - the total time in milliseconds.

**Throws:**

- `TypeError` – if any of the provided values is not a number or `undefined`.

**Example:**

```typescript
timeInMilliseconds({ seconds: 1 }); // Returns 1000
timeInMilliseconds({ minutes: 1, seconds: 30 }); // Returns 90000
timeInMilliseconds({ hours: 1, minutes: 30, seconds: 45, milliseconds: 500 }); // Returns 5,445,500
```

### `dispose`

A function that allows you to clear an object's data, if the object supports this feature.

**Parameters:**

- `object: any` - an object that supports resource cleaning.

**Returns:**

`void` - The function does not return anything.

**Throws:**

- `ReferenceError` – if the object does not support resource cleanup.
