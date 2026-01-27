# AbortError

A class for representing interruption errors. Extends the built-in `Error` class and adds interrupt-specific properties.

## 🔧 API

### Import

```javascript
import { AbortError } from 'saborter';
```

### Properties

`code`

- **Type:** `number`
- **Description:** Interrupt error code.

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

`signal?`

- **Type:** `AbortSignal`
- **Description:** AbortSignal that was just interrupted.
- **Optional:** `true`

`cause?`

- **Type:** `Error`
- **Description:** A field containing additional error information indicating the reason for the current error.

`stack`

- **Type:** `string`
- **Description:** Default stack field `Error` with extended information.

`initiator`

- **Type:** `'timeout' | 'user' | 'system'`
- **Description:** A field with the name of the error initiator.
- **Default:** `user`

When the error is triggered by a `timeout`, it means that automatic request cancellation was configured and the cancellation was successful.

When the error is triggered by the `user`, it means that the user interrupted the request by calling the `abort()` method.

When the error is triggered by the `system`, it means that you caught an error canceling a previous request.

### Methods

`expandStack()`

Expands the `stack` with additional error information.
Enabled by `default`.

`restoreStack()`

Restores the `stack` to default.

### Constructor

```javascript
new AbortError(message, options?)
```

**Parameters:**

- `message: string` - Text error message
- `options?: Object` (optional)
  - `type?: 'cancelled' | 'aborted'` - Abort type. Default is `aborted`
  - `reason?: any` - Additional reason for interruption
  - `signal?: AbortSignal` - AbortSignal that was just interrupted

## 🎯 Usage Examples

### Basic Usage

```javascript
const error = new AbortError('The operation was interrupted');

console.error(error.message); // 'The operation was interrupted'
console.error(error.type); // 'aborted'
console.error(error.code); // 20 (ABORT_ERR)
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
