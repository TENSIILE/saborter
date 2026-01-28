# TimeoutError

A class for representing timeout interrupt errors. Extends the built-in `Error` class and adds properties specific to timeout interrupts.

## 🔧 API

### Import

```javascript
import { TimeoutError } from 'saborter';
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

### Methods

`static restoreStack()`

Initially, the error `stack` is extended with additional error metadata information.

Restores the `stack` to default.

**Returns:** `void`

### Constructor

```javascript
new TimeoutError(message, options?)
```

**Parameters:**

- `message: string` - Text error message
- `options?: Object` (optional)
  - `ms?: number` - Time in milliseconds after which interrupts should be started

## 🎯 Usage Examples

### Basic Usage

```javascript
// Basic Usage
const error = new TimeoutError('Request timed out');

// With Options
const error = new TimeoutError('The operation exceeded its execution time', {
  ms: 3000
});

// Accessing Properties
console.log(error.timestamp); // 1641234567890
console.log(error.ms); // 3000
```
