# ReusableAborter

## 📖 Overview

The `ReusableAborter` class manages an `AbortSignal` that can be reused after it has been aborted. It wraps an `AbortController` and transparently overrides the signal's `addEventListener` and `removeEventListener` methods to capture all non‑once listeners. When `.abort()` is called, the current controller is aborted, a new controller is created, and all previously captured listeners are re‑attached to the new signal. This allows the same logical signal to be used across multiple abort cycles without the caller needing to create a new controller manually.

**Purpose:**

In scenarios where you need to abort an operation and then later start a new operation with a fresh signal, you typically have to create a new `AbortController` and propagate it to all consumers. `ReusableAborter` encapsulates this pattern: it presents a single `signal` property that always returns the current active signal. When you abort, the signal is automatically replaced, and any listeners that were attached (except those marked with `once: true`) are carried over to the new signal. This is especially useful for long‑lived objects (e.g., services, managers) that need to handle repeated cancellations.

## 🔧 API

### Import

```javascript
import { ReusableAborter } from 'saborter';
```

### Constructor

```typescript
constructor(props: ReusableAborterProps = { attractListeners: true })
```

**Parameters:**

- `props?: Object` - Configuration object.
  - `attractListeners?: boolean | AttractListeners` (default `true`) - Controls which listeners are captured and restored. It can be a boolean, or an object. Typical values might be:
    - `true` — capture both event handlers and the `onabort` handler.
    - `false` — capture nothing.
    - an object, such as `{ eventListeners: true }` or `{ onabort: true }`, to capture only certain types.

If `attractListeners` includes `'eventListeners'`, the class will override the signal's `addEventListener`/`removeEventListener` to capture non‑once listeners. If it includes `'onabort'`, it will also copy the `onabort` property from the old signal to the new one during recovery.

### Methods

`public abort(reason?: any): void`

Aborts the current signal and resets the internal controller.

### Properties

`signal: AbortSignal`

Returns the current active signal.

## 🎯 Usage Example

```typescript
import { ReusableAborter } from 'saborter';

// Create a reusable aborter that captures both event listeners and onabort
const aborter = new ReusableAborter();

// Get the current signal
const signal = aborter.signal;

// Attach listeners
signal.addEventListener('abort', () => console.log('Listener 1'));
signal.addEventListener('abort', () => console.log('Listener 2'), { once: true }); // won't be recovered

// Set onabort handler
signal.onabort = () => console.log('Onabort handler');

// First abort
aborter.abort('First reason');
// Output:
// Listener 1
// Listener 2 (once)
// Onabort handler

// The signal is now a fresh one, but the non‑once listeners and onabort are reattached
signal.addEventListener('abort', () => console.log('Listener 3')); // new listener, will survive next abort

// Second abort
aborter.abort('Second reason');
// Output:
// Listener 1
// Onabort handler
// Listener 3
```
