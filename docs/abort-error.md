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
