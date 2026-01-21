# EventListener

## 📖 Overview

The `EventListener` class provides an event management system for handling operation interruption events. It implements the observer pattern for events of types `aborted` and `cancelled`.

## 📝 Event Types

Two event types are supported:

- **`aborted`** - operation was aborted
- **`cancelled`** - operation was cancelled

## 🔧 API

### Methods

`addEventListener(type, listener): VoidFunction`

Adds an event listener for the specified event type.

**Parameters:**

- `type: 'aborted' | 'cancelled'` - event type
- `listener: (error: AbortError): void` - event handler function

**Returns:** A function to remove the event listener (unsubscribe)

**Example:**

```typescript
const unsubscribe = listener.addEventListener('aborted', (error) => {
  console.log('Operation aborted:', error);
});

// Call the returned function to unsubscribe
unsubscribe();
```

`removeEventListener(type, listener): void`

Removes an event listener for the specified event type.

**Parameters:**

- `type: 'aborted' | 'cancelled'` - event type
- `listener: (error: AbortError): void` - event handler function to remove

`dispatchEvent(type, error): void`

Dispatches an event of the specified type, calling all registered handlers.

**Parameters:**

- `type: 'aborted' | 'cancelled'` - event type to dispatch
- `event: AbortError` - event data passed to handlers

**Special Note:** When dispatching `'aborted'` or `'cancelled'` events, the global `onabort` handler is also called.

### Properties

`onabort?: OnAbortCallback`

Global handler called for any abort event (`aborted` or `cancelled`).

**Example:**

```typescript
aborter.listeners.onabort = (error) => {
  console.log('Global abort handler:', error);
};
```

`state`

Returns an `StateObserver` object for monitoring the status of requests.

[Detailed documentation here](./state-observer.md)

## 🎯 Usage Examples

### Basic Usage

```typescript
import { Aborter, AbortError } from 'saborter';

// Create Aborter instance with global handler
const aborter = new Aborter({
  onAbort: (error) => {
    console.log('Global abort detected:', error);
  }
});

// Add specific event handlers
const removeAbortedHandler = aborter.listeners.addEventListener('aborted', (error) => {
  console.log('Aborted error:', error);
});

const removeCancelledHandler = aborter.listeners.addEventListener('cancelled', (error) => {
  console.log('Cancelled error:', error);
});

// Dispatch an event
aborter.listeners.dispatchEvent('aborted', new AbortError('message error'));

// Remove handler
removeAbortedHandler();
```

### Catching an error by timeout

```typescript
import { Aborter } from 'saborter';

// Create Aborter instance with global handler
const aborter = new Aborter({
  onAbort: (error) => {
    if (error.initiator === 'timeout') {
      // We caught a bug caused by a timeout
    }
  }
});

// Add specific event handlers
const removeAbortedHandler = aborter.listeners.addEventListener('aborted', (error) => {
  if (error.initiator === 'timeout') {
    // We caught a bug caused by a timeout
  }
});
```

#### Getting arguments for an error caused by a timeout

```typescript
import { Aborter, TimeoutError } from 'saborter';

// Create Aborter instance with global handler
const aborter = new Aborter({
  onAbort: (error) => {
    if (error.initiator === 'timeout' && error.cause instanceof TimeoutError) {
      console.log(error.cause.ms, error.cause.hasThrow); // `error.cause` — TimeoutError
    }
  }
});
```
