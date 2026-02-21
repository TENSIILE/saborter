# Saborter Changelog

## v2.0.0

### Breaking Changes

- Removed the `isError` static method from the `Aborter` class.
- Removed the static field `errorName` from the `Aborter` class.
- The `code` and `signal` fields have been removed from `AbortError`.
- Moved the `dispose` method of the `Aborter` instance into a separate function.
- Changed the `isAborted` field to `aborted` in the `Aborter` class.

### New Features

- Added a `ReusableAborter`.
- Added the ability to automatically unpack data from `fetch()`.
- Added `metadata` field for `AbortError` and `TimeoutError`.
- Added utility functions:
  - isAbortError
  - debounce
  - catchAbortError
  - isAbortSignal
  - rethrowAbortSignal
  - setTimeoutAsync
  - throwIfAborted
  - timeInMilliseconds
  - dispose

## v1.5.1 (February 11th, 2026)

### Bug Fixes

- Fixes a bug in the `Aborter.isError` function where any argument passed returned `true` [#41](https://github.com/TENSIILE/saborter/pull/41)

## v1.5.0 (February 4th, 2026)

### New Features

- Adds a one-time execution option (`once`) to `EventListener` [#32](https://github.com/TENSIILE/saborter/pull/32)
- Adds an extended stack for the `AbortError` error [#33](https://github.com/TENSIILE/saborter/pull/33)
- Adds a `reason` option to `TimeoutError` [#34](https://github.com/TENSIILE/saborter/pull/34)
- Adds the `isAborted` flag to `Aborter` [#37](https://github.com/TENSIILE/saborter/pull/37)

### Bug Fixes

- Fixes a bug where the request state would not change to `cancelled` [#35](https://github.com/TENSIILE/saborter/pull/35)

## v1.4.2 (January 22th, 2026)

### Bug Fixes

- Aborting a request is `rejected`, and cancellations of previous requests are ignored. [#31](https://github.com/TENSIILE/saborter/pull/31/commits/40a3163732cd3850b833044b89491748119328fe)
- `TimeoutError` is now always accepted as a catch. [#31](https://github.com/TENSIILE/saborter/pull/31/commits/40a3163732cd3850b833044b89491748119328fe)

## v1.4.1 (January 21th, 2026)

### Bug Fixes

- Fixes a bug where the `catch` block would receive a regular error, rather than the custom `AbortError` error. [#29](https://github.com/TENSIILE/saborter/pull/29/commits/17615026f47ead51bbf290d4119dd451b9640d75)
- Fixes a typing error where IntelliSense does not suggest options for the `AbortError` error. [#29](https://github.com/TENSIILE/saborter/pull/29/commits/bb20db451bc06caa95ea0e645d744863409688b0)
- The documentation has been corrected: [#29](https://github.com/TENSIILE/saborter/pull/29/commits/1116fb7bd851c405d794aa71991f400a4c12741a)
  - `RequestState API` now provides a little more information about the `rejected` state.
  - The `initiator` field for the `AbortError` error is now always `Error`.

## v1.4.0 (January 21th, 2026)

### New Features

- `Timeout API` - Ability to create automatic cancellation of a request.
  - `TimeoutError` **class** - Error for working with timeout interrupt.
- `RequestState API` - The ability to find out what status the request is currently in.
- `cause` | `initiator` **property** - New properties of `AbortError`.
- `dispose()` **method** - Clears the object's data completely: all subscriptions in all properties, clears overridden methods, state values.

### Bug Fixes

- Fixes a bug where the first event would start with a cancellation, even if there was nothing to cancel [#23](https://github.com/TENSIILE/saborter/pull/23)

## v1.3.0 (January 11th, 2026)

### New Features

- `AbortError` **class** - A class for representing interruption errors. Extends the built-in `Error` class and adds interrupt-specific properties.
- `abortWithRecovery()` **method** - Immediately cancels the currently executing request and then restores the `AbortSignal` to its working state.
- `listeners` **property** - Returns an `EventListener` object to listen for `Aborter` events.

## v1.2.0 (January 4th, 2026)

### New Features

- Aborter **class** - main class for managing request cancellation
- `try()` **method** - executes asynchronous requests with automatic cancellation of previous ones
- `abort()` **method** - manual cancellation of current request
- `signal` **property** - access to `AbortSignal` of current controller
- **Static** `isError()` **method** - checks if error is an `AbortError`
- **Static** `errorName` **property** - instance error name `AbortError`
