# Saborter Changelog

## v2.4.0 (April 23th, 2026)

### New Features

- Added `isTimeoutError` function to determine whether the given error is a timeout error [#80](https://github.com/TENSIILE/saborter/pull/82/changes/9adbc0237df3944b21cb60488105b0238d36d10d)
- Added `Provision API` that injects the `Aborter` context into the `Http API` [#81](https://github.com/TENSIILE/saborter/pull/82/changes/7b9a6ce4f8050aceb6c3e1c13d93a42c41b9a497)

## v2.3.0 (April 15th, 2026)

### New Features

- Added `onInit` initialization handler for `Aborter` [#76](https://github.com/TENSIILE/saborter/pull/77/changes/f7f9546afdacccbc02693b467f970868464813a7)
- Added new events `fulfilled` and `rejected` for `EventListener` [#75](https://github.com/TENSIILE/saborter/pull/77/changes/3d78741b0bdca9ce73a176546d05d926a17d1310)

### Other changes

- Debug mode for the error stack is enabled by default [#76](https://github.com/TENSIILE/saborter/pull/77/changes/1fd0ed7f304eb0324d36fe210df812ed61ac1cfa)
- Added more logs to `Aborter` [#77](https://github.com/TENSIILE/saborter/pull/77/changes/40210fcc922153f4135fc56daeabe87b35c0433a)

## v2.2.0 (Match 31th, 2026)

### New Features

- Added the `abortSignalAny` utility function [#60](https://github.com/TENSIILE/saborter/pull/60)
- Added integration functionality with the `@saborter/server` package [#60](https://github.com/TENSIILE/saborter/pull/60)
- Improved JSdoc documentation for `Aborter` [#60](https://github.com/TENSIILE/saborter/pull/60)

### Bug Fixes

- Fixed a bug in the `debounce` and `setTimeoutAsync` utilities with overriding the `initiator` field in the `AbortError` error [#60](https://github.com/TENSIILE/saborter/pull/60)

## v2.1.0 (March 18th, 2026)

### New Features

- Added break promises without signal [#56](https://github.com/TENSIILE/saborter/pull/56)

## v2.0.1 (March 1th, 2026)

### Bug Fixes

- Fixed argument injection in `setTimeoutAsync` and `debounce` functions [#54](https://github.com/TENSIILE/saborter/pull/54)

## v2.0.0 (February 24th, 2026)

### Breaking Changes

- Removed the `isError` static method from the `Aborter` class.
- Removed the static field `errorName` from the `Aborter` class.
- The `code` and `signal` fields have been removed from `AbortError`.
- Moved the `dispose` method of the `Aborter` instance into a separate function.
- Changed the `isAborted` field to `aborted` in the `Aborter` class.

### New Features

- Added a `ReusableAborter`. [#45](https://github.com/TENSIILE/saborter/pull/45)
- Added the ability to automatically unpack data from `fetch()`.
- Added `metadata` field for `AbortError` and `TimeoutError`. [#45](https://github.com/TENSIILE/saborter/pull/45/changes/12a8e6013d6fe451ac529dea04390d5d38164f0d)
- Added utility functions: [#43](https://github.com/TENSIILE/saborter/pull/43)
  - `isAbortError` - a type guard function that determines whether a given error is an `AbortError`.
  - `debounce` - creates a debounced function that delays invoking the provided handler until after a specified timeout has elapsed since the last call.
  - `catchAbortError`- this function catches errors that are `AbortError`'s and ignores them, while re‑throwing any other error.
  - `isAbortSignal` - a type guard that checks whether a given value is an instance of `AbortSignal`.
  - `rethrowAbortSignal` - this function is the complement of `catchAbortError`. It re‑throws the error only if it is an `AbortError`; otherwise, it does nothing.
  - `setTimeoutAsync` - schedules the execution of a handler after a specified delay.
  - `throwIfAborted` - a utility that checks whether an `AbortSignal` has been aborted. If the signal is aborted, it throws an `AbortError`.
  - `timeInMilliseconds` - converts a configuration object containing time components (hours, minutes, seconds, milliseconds) into a total number of milliseconds.
  - `dispose` - a function that allows you to clear an object's data, if the object supports this feature.
  - `setLoggerMode` - sets the global `Saborter` logging mode for the application.
  - `setDebugErrorStackMode` - changes the error stack mode, enabling or disabling debug information.

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
