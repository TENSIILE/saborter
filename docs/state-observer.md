# StateObserver

## 📖 Overview

`StateObserver` is a class for observing the state of a request.

## 🔧 API

### Methods

`subscribe(callbackfn): VoidFunction`

Subscribes a callback function to state changes.

**Parameters:**

- `callbackfn: OnStateChangeCallback` - Function to be called when state changes. Receives the new state as an argument

**Returns:** An unsubscribe function to remove the subscription.

**Example:**

```typescript
const unsubscribe = aborter.listeners.state.subscribe((state) => {
  console.log('Subscriber:', state);
});

// Call the returned function to unsubscribe
unsubscribe();
```

`unsubscribe(callbackfn): void`

Unsubscribes a callback function from state changes.

**Parameters:**

- `callbackfn: OnStateChangeCallback` - Function to unsubscribe

**Example:**

```typescript
const callback = (state: RequestState) => console.log('State:', state);
aborter.listeners.state.subscribe(callback);

// Later:
aborter.listeners.state.unsubscribe(callback);
```

### Properties

`value?: RequestState`

Current state value. May be `undefined` if state hasn't been set yet.

Five types of states are supported:

- **`cancelled`** - the previous operation was cancelled
- **`pending`** - the current operation is still in progress
- **`fulfilled`** - the operation was completed successfully
- **`rejected`** - the operation was a failure. An error was caught in the request itself, or a syntax error
- **`aborted`** - the operation was interrupted

`onstatechange?: OnStateChangeCallback`

Callback function invoked on every state change. Can be set via constructor or directly.

**Example:**

```typescript
aborter.listeners.state.onstatechange = (state) => {
  console.log('Global handler for receiving request status:', state);
};
```

## 🎯 Usage Examples

### Basic Usage

```typescript
import { Aborter } from 'saborter';

// Create Aborter instance with global handler
const aborter = new Aborter({
  onStateChange: (state) => console.log('Main handler:', state)
});

// Subscribe to changes
const unsubscribe = aborter.listeners.state.subscribe((state) => {
  console.log('Subscriber 1:', state);
});

// Unsubscribe
unsubscribe();
```
