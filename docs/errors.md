# Error documentation

## `AbortError`

A class for representing interruption errors. Extends the built-in `Error` class and adds interrupt-specific properties.

## 🔧 API

### Import

```javascript
import { AbortError } from 'saborter/errors';
```

### Properties

`name`

- **Type:** `'AbortError'` (const string)
- **Description:** Interrupt error name.

`message`

- **Type:** `string`
- **Description:** Interrupt error message.

`type`

- **Type:** `'cancelled' | 'aborted'`
- **Description:** Abort type.
- **Default:** `aborted`

`timestamp`

- **Type:** `number`
- **Description:** The timestamp in milliseconds when the error was created.
- **Default:** `Date.now()`

`reason?`

- **Type:** `any`
- **Description:** Additional reason or data associated with the interrupt.
- **Optional:** `true`

`cause?`

- **Type:** `Error`
- **Description:** A field containing additional error information indicating the reason for the current error.

`stack`

- **Type:** `string`
- **Description:** The default stack field is 'Error' without extended information. To enable extended information, [see here](#🎯-usage-examples).

`initiator`

- **Type:** `'timeout' | 'user' | 'system'`
- **Description:** A field with the name of the error initiator.
- **Default:** `user`

When the error is triggered by a `timeout`, it means that automatic request cancellation was configured and the cancellation was successful.

When the error is triggered by the `user`, it means that the user interrupted the request by calling the `abort()` method.

When the error is triggered by the `system`, it means that you caught an error canceling a previous request.

### Constructor

```javascript
new AbortError(message, options?)
```

**Parameters:**

- `message: string` - Text error message.
- `options?: Object`
  - `type?: 'cancelled' | 'aborted'` (Default is `aborted`) - Abort type.
  - `reason?: any` - Additional reason for interruption.
  - `signal?: AbortSignal` - AbortSignal that was just interrupted.

## 🎯 Usage Examples

### Basic Usage

```javascript
const error = new AbortError('The operation was interrupted');

console.error(error.message); // 'The operation was interrupted'
console.error(error.type); // 'aborted'
```

### Creation with type and reason

```javascript
const error = new AbortError('Request cancelled', {
  type: 'cancelled',
  reason: { requestId: '123', userId: 'user_456' }
});

console.error(error.type); // 'cancelled'
console.error(error.reason); // { requestId: '123', userId: 'user_456' }
```

### Creation with signal

```javascript
const aborter = new Aborter(); // You can also use AbortController

const error = new AbortError('The operation was interrupted', {
  signal: aborter.signal
});

console.log(error.signal); // The signal that was transmitted
```

### Active additional debug information in the error stack

```javascript
import { AbortError } from 'saborter/errors';
import { setDebugErrorStackMode } from 'saborter/dev';

// Activating the extended debug stack information
// The error stack is expanded exclusively for Saborter errors
setDebugErrorStackMode(true);

const abortError = new AbortError('Aborted');

// In the console you will see an expanded stack with the full list of data for this error
console.log(abortError);
```

## `TimeoutError`

A class for representing timeout interrupt errors. Extends the built-in `Error` class and adds properties specific to timeout interrupts.

## 🔧 API

### Import

```javascript
import { TimeoutError } from 'saborter/errors';
```

### Properties

`name`

- **Type:** `'TimeoutError'` (const string)
- **Description:** Timeout error name.

`message`

- **Type:** `string`
- **Description:** Timeout error message.

`timestamp`

- **Type:** `number`
- **Description:** The timestamp in milliseconds when the error was created.
- **Default:** `Date.now()`

`ms?`

- **Type:** `number`
- **Description:** A field displaying the time in milliseconds after which the request was interrupted.
- **Optional:** `true`

`reason?`

- **Type:** `any`
- **Description:** Additional reason or data associated with the interrupt.
- **Optional:** `true`

`metadata?`

- **Type:** `any`
- **Description:** Interrupt-related data. The best way to pass any data inside the error. This field will not be overridden in any way.
- **Optional:** `true`

### Constructor

```javascript
new TimeoutError(message, options?)
```

**Parameters:**

- `message: string` - Text error message.
- `options?: Object`
  - `ms?: number` - Time in milliseconds after which interrupts should be started.
  - `reason?: any` - A field storing the error reason.
  - `metadata?: any` - Interrupt-related data. The best way to pass any data inside the error.

## 🎯 Usage Examples

### Basic Usage

```javascript
// Basic Usage
const error = new TimeoutError('Request timed out');

// With Options
const error = new TimeoutError('The operation exceeded its execution time', {
  ms: 3000,
  reason: 'any reason',
  metadata: { userId: 1 }
});

// Accessing Properties
console.log(error.timestamp); // 1641234567890
console.log(error.ms); // 3000
console.log(error.reason); // 'any reason'
console.log(error.metadata); //  { userId: 1 }
```

### Active additional debug information in the error stack

```javascript
import { TimeoutError } from 'saborter/errors';
import { setDebugErrorStackMode } from 'saborter/dev';

// Activating the extended debug stack information
// The error stack is expanded exclusively for Saborter errors
setDebugErrorStackMode(true);

const timeoutError = new TimeoutError('Request timed out');

// In the console you will see an expanded stack with the full list of data for this error
console.log(timeoutError);
```
