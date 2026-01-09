# EventListener

## 📖 Overview

The `EventListener` class provides an event management system for handling operation interruption events. It implements the observer pattern for events of types `aborted` and `cancelled`.

## 📝 Event Types

Two event types are supported:

- **`aborted`** - operation was aborted
- **`cancelled`** - operation was cancelled

## 🔧 API

### Methods

### `addEventListener<T extends EventListenerType, L extends EventCallback<T>>(type: T, listener: L): () => void`

Adds an event listener for the specified event type.

**Parameters:**

- `type` - event type (`'aborted'` | `'cancelled'`)
- `listener` - event handler function

**Returns:** A function to remove the event listener (unsubscribe)

**Example:**

```typescript
const unsubscribe = listener.addEventListener('aborted', event => {
  console.log('Operation aborted:', event);
});

// Call the returned function to unsubscribe
unsubscribe();
```

### `removeEventListener<T extends EventListenerType, L extends EventCallback<T>>(type: T, listener: L): void`

Removes an event listener for the specified event type.

**Parameters:**

- `type` - event type
- `listener` - event handler function to remove

### `dispatchEvent<T extends EventListenerType, E extends EventMap<T>>(type: K, event: E): void`

Dispatches an event of the specified type, calling all registered handlers.

**Parameters:**

- `type` - event type to dispatch
- `event` - event data passed to handlers

**Special Note:** When dispatching `'aborted'` or `'cancelled'` events, the global `onabort` handler is also called.

### Properties

### `onabort?: OnAbortCallback`

Global handler called for any abort event (`aborted` or `cancelled`).

**Example:**

```typescript
aborter.listeners.onabort = event => {
  console.log('Global abort handler:', event);
};
```

## 🎯 Usage Examples

### Basic Usage

```typescript
import { Aborter } from 'saborter';

// Create Aborter instance with global handler
const aborter = new Aborter({
  onabort: event => {
    console.log('Global abort detected:', event);
  }
});

// Add specific event handlers
const removeAbortedHandler = aborter.listeners.addEventListener('aborted', event => {
  console.log('Aborted event:', event);
});

const removeCancelledHandler = aborter.listeners.addEventListener('cancelled', event => {
  console.log('Cancelled event:', event);
});

// Dispatch an event
aborter.listeners.dispatchEvent('aborted', new AbortError('message error'));

// Remove handler
removeAbortedHandler();
```
