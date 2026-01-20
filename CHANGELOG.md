# Saborter Changelog

## v1.4.0 (January 20th, 2026)

### New Features

- `Timeout API` - Ability to create automatic cancellation of a request.
  - `TimeoutError` **class** - Error for working with timeout interrupt.
- `State Request API` - The ability to find out what status the request is currently in.
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
