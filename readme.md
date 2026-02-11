![Logo](./assets/logo.png)

[![Npm package](https://img.shields.io/npm/v/saborter?color=red&label=npm%20package)](https://www.npmjs.com/package/saborter)
![Static Badge](https://img.shields.io/badge/coverage-90%25-orange)
![Static Badge](https://img.shields.io/badge/license-MIT-blue)
[![Github](https://img.shields.io/badge/repository-github-color)](https://github.com/TENSIILE/saborter)

A simple and effective library for canceling asynchronous requests using AbortController.

## 📚 Documentation

The documentation is divided into several sections:

- [Installation](#📦-installation)
- [Why Saborter?](#📈-why-saborter)
- [Quick Start](#🚀-quick-start)
- [Key Features](#📖-key-features)
- [API](#🔧-api)
- [Additional APIs](#🔌-additional-apis)
- [Important Features](#⚠️-important-features)
- [Troubleshooting](#🐜-troubleshooting)
- [Usage Examples](#🎯-usage-examples)
- [Compatibility](#💻-compatibility)
- [License](#📋-license)

## 📦 Installation

```bash
npm install saborter
# or
yarn add saborter
```

### Related libraries

- [React](https://github.com/TENSIILE/saborter-react) - a standalone library with `Saborter` and `React` integration.

## 📈 Why Saborter ?

| Function/Characteristic                                                                                                               | Saborter | AbortController |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- |
| Eliminated race condition when speed typing.                                                                                          | ✔️       | ✖️              |
| The signal is created anew, there is no need to recreate it yourself. After `abort()` you can "reset" and use it again.               | ✔️       | ✖️              |
| Legible error handling across all browsers.                                                                                           | ✔️       | ✖️              |
| There is extended information about request interruptions: who cancelled, when, and the reason.                                       | ✔️       | ✖️              |
| The signal will always be new. It's no coincidence that a previously disabled signal can appear from outside, which breaks all logic. | ✔️       | ✖️              |

## 🚀 Quick Start

### Basic Usage

```javascript
import { Aborter } from 'saborter';

// Create an Aborter instance
const aborter = new Aborter();

// Use for the request
const fetchData = async () => {
  try {
    const result = await aborter.try((signal) => fetch('/api/data', { signal }));
    console.log('Data received:', result);
  } catch (error) {
    console.error('Request error:', error);
  }
};
```

## 📖 Key Features

### 1. Automatically canceling previous requests

Each time `try()` is called, the previous request is automatically canceled:

```javascript
// When searching with autocomplete
const handleSearch = async (query) => {
  // The previous request is automatically canceled
  const results = await aborter.try((signal) => fetch(`/api/search?q=${query}`, { signal }));
  return results;
};

// When the user quickly types:
handleSearch('a'); // Starts
handleSearch('ab'); // The first request is canceled, a new one is started
handleSearch('abc'); // The second request is canceled, a new one is started
```

### 2. Automatic cancellation of requests

The `Aborter` class allows you to easily cancel ongoing requests:

```javascript
const aborter = new Aborter();

const fetcher = (signal) => fetch('/api/long-task', { signal });

// Start a long-running request and cancel the request after 2 seconds
const longRequest = aborter.try(fetcher, { timeout: { ms: 2000 } });
```

### 3. Working with Multiple Requests

You can create separate instances for different groups of requests:

```javascript
// Separate requests by type
const userAborter = new Aborter();
const dataAborter = new Aborter();

// Manage user requests separately
const fetchUser = async (id) => {
  return userAborter.try((signal) => fetch(`/api/users/${id}`, { signal }));
};

// And manage data separately
const fetchData = async (params) => {
  return dataAborter.try((signal) => fetch('/api/data', { signal, ...params }));
};

// Cancel only user requests
const cancelUserRequests = () => {
  userAborter.abort();
};
```

## 🔧 API

### Constructor

```typescript
const aborter = new Aborter(options?: AborterOptions);
```

### Constructor Parameters

| Parameter | Type             | Description                   | Required |
| --------- | ---------------- | ----------------------------- | -------- |
| `options` | `AborterOptions` | Aborter configuration options | No       |

**AborterOptions:**

```typescript
{
  /*
    Callback function for abort events.
    Associated with EventListener.onabort.
    It can be overridden via `aborter.listeners.onabort`
  */
  onAbort?: OnAbortCallback;

  /*
    A function called when the request state changes.
    It takes the new state as an argument.
    Can be overridden via `aborter.listeners.state.onstatechange`
  */
  onStateChange?: OnStateChangeCallback;
}
```

### Properties

⚠️ `[DEPRECATED] signal`

Returns the `AbortSignal` associated with the current controller.

> [!WARNING]
> It's best not to use a signal to subscribe to interrupts or check whether a request has been interrupted.
> The signal is updated on every attempt, and your subscriptions will be lost, causing a memory leak.

```javascript
const aborter = new Aborter();

// Using signal in the request
fetch('/api/data', {
  signal: aborter.signal
});
```

`isAborted`

Returns a `boolean` value indicating whether the request was aborted or not.

`listeners`

Returns an `EventListener` object to listen for `Aborter` events.

[Detailed documentation here](./docs/event-listener.md)

⚠️ `[DEPRECATED] static errorName`

Use `AbortError.name`.

Name of the `AbortError` error instance thrown by AbortSignal.

```javascript
const result = await aborter
  .try((signal) => fetch('/api/data', { signal }), { isErrorNativeBehavior: true })
  .catch((error) => {
    if (error.name === AbortError.name) {
      console.log('Canceled');
    }
  });
```

### Methods

`try(request, options?)`

Executes an asynchronous request with the ability to cancel.

**Parameters:**

- `request: (signal: AbortSignal) => Promise<T>` - the function that fulfills the request
- `options?: Object` (optional)
  - `isErrorNativeBehavior?: boolean` - a flag for controlling error handling. Default is `false`
  - `timeout?: Object`
    - `ms: number` - Time in milliseconds after which interrupts should be started
    - `reason?: any` - A field storing the error reason. Can contain any metadata

**Returns:** `Promise<T>`

**Examples:**

```javascript
// Simple request
const result = await aborter.try((signal) => {
  return fetch('/api/data', { signal }).then((response) => response.json());
});

// With custom request logic
const result = await aborter.try(async (signal) => {
  const response = await fetch('/api/data', { signal });
  if (!response.ok) {
    throw new Error('Server Error');
  }
  return response.json();
});
```

**Examples using automatic cancellation after a time:**

```javascript
// Request with automatic cancellation after 2 seconds
const result = await aborter.try(
  (signal) => {
    return fetch('/api/data', { signal });
  },
  { timeout: { ms: 2000 } }
);

// We want to get an error in the "catch" block
try {
  const result = await aborter.try(
    (signal) => {
      return fetch('/api/data', { signal });
    },
    { timeout: { ms: 2000 } }
  );
} catch (error) {
  if (error instanceof AbortError && error.initiator === 'timeout') {
    // We'll get an AbortError error here with a timeout reason.

    if (error.cause instanceof TimeoutError) {
      // To get the parameters that caused the timeout error,
      // they can be found in the "cause" field using the upstream typeguard.

      console.log(error.cause.ms); // `error.cause` — TimeoutError
    }
  }
}
```

If you want to catch a [timeout error through events or subscriptions](./docs/event-listener.md#catching-an-error-by-timeout), you can do that.

`abort(reason?)`

**Parameters:**

- `reason?: any` - the reason for aborting the request (optional)

Immediately cancels the currently executing request.

**Examples:**

```javascript
// Start the request
const requestPromise = aborter.try((signal) => fetch('/api/data', { signal }), { isErrorNativeBehavior: true });

// Handle cancellation
requestPromise.catch((error) => {
  if (error.name === 'AbortError') {
    console.log('Request canceled');
  }
});

// Cancel
aborter.abort();
```

You can specify any data as the `reason`.
If we want to pass an `object`, we can put the error message in the `message` field. The same object will be available as the `reason` in the case of the `AbortError` error.

```javascript
// Start the request
const requestPromise = aborter.try((signal) => fetch('/api/data', { signal }));

// Handle cancellation
requestPromise.catch((error) => {
  if (error instanceof AbortError) {
    console.log(error.message); // Hello
    console.log(error.reason); // { message: 'Hello', data: [] }
  }
});

// Cancel
aborter.abort({ message: 'Hello', data: [] });
```

You can also submit your own `AbortError` with your own settings.

> [!WARNING]
> Please be careful, the behavior of the `Aborter` function may be broken in its original form when reconfiguring the options.

```javascript
// Start the request
const requestPromise = aborter.try((signal) => fetch('/api/data', { signal }));

// Handle cancellation
requestPromise.catch((error) => {
  if (error instanceof AbortError) {
    console.log(error.message); // 'Custom AbortError message'
    console.log(error.reason); // 1
  }
});

// Cancel
aborter.abort(new AbortError('Custom AbortError message', { reason: 1 }));
```

`abortWithRecovery(reason?)`

Immediately cancels the currently executing request.
After aborting, it restores the `AbortSignal`, resetting the `aborted` property, and interaction with the `signal` property becomes available again.

**Parameters:**

- `reason?: any` - the reason for aborting the request (optional)

**Returns:** `AbortController`

**Examples:**

```javascript
// Create an Aborter instance
const aborter = new Aborter();

// Data retrieval function
const fetchData = async () => {
  try {
    const data = await fetch('/api/data', { signal: aborter.signal });
  } catch (error) {
    // ALL errors, including cancellations, will go here
    console.log(error);
  }
};

// Calling a function with a request
fetchData();

// We interrupt the request and then restore the signal
aborter.abortWithRecovery();

// Call the function again
fetchData();
```

`dispose()`

**Returns:** `void`

Clears the object's data completely: all subscriptions in all properties, clears overridden methods, state values.

> [!WARNING]
> The request does not interrupt!

`static isError(error)`

Static method for checking if an object is an `AbortError` error.

> [!IMPORTANT]
>
> - The method will return `true` even if it receives a native AbortError that is thrown by the `DOMException` itself, or finds a hint of a request abort in the error message.
> - To exclusively verify that the error is an `AbortError` from the `saborter` package, it is better to use: `error instance AbortError`

```javascript
try {
  await aborter.try((signal) => fetch('/api/data', { signal }), { isErrorNativeBehavior: true });
} catch (error) {
  if (Aborter.isError(error)) {
    console.log('This is a cancellation error');
  } else {
    console.log('Another error:', error);
  }
}

// or

try {
  await aborter.try((signal) => fetch('/api/data', { signal }), { isErrorNativeBehavior: true });
} catch (error) {
  if (error instanceof AbortError) {
    console.log('This is a cancellation error');
  } else {
    console.log('Another error:', error);
  }
}
```

## 🔌 Additional APIs

- [**AbortError**](./docs/abort-error.md) - Custom error for working with Aborter.
- [**TimeoutError**](./docs/timeout-error.md) - Error for working with timeout interrupt.

## ⚠️ Important Features

### Error Handling

By default, the `try()` method does not reject the promise on `AbortError` (cancellation error). This prevents the `catch` block from being called when the request is canceled.

If you want the default behavior (the promise to be rejected on any error), use the `isErrorNativeBehavior` option:

```javascript
// The promise will be rejected even if an AbortError occurs
const result = await aborter
  .try((signal) => fetch('/api/data', { signal }), { isErrorNativeBehavior: true })
  .catch((error) => {
    // ALL errors, including cancellations, will go here
    if (error.name === 'AbortError') {
      console.log('Cancelled');
    }
  });
```

### Resource Cleanup

Always abort requests when unmounting components or closing pages:

```javascript
// In React
useEffect(() => {
  const aborter = new Aborter();

  // Make requests

  return () => {
    aborter.abort(); // Clean up on unmount
  };
}, []);
```

### Finally block

Ignoring `AbortError` cancellation errors, the `finally` block will only be executed if other errors are received, or if an abort error or the request succeeds.

```javascript
const result = await aborter
  .try((signal) => fetch('/api/data', { signal }))
  .catch((error) => {
    // Any error other than a request cancellation will be logged here.
    console.log(error);
  })
  .finally(() => {
    // The request was successfully completed or we caught a "throw"
  });
```

Everything will also work if you use the `try-catch` syntax.

```javascript
try {
  const result = await aborter.try((signal) => fetch('/api/data', { signal }));
} catch (error) {
  // Any error other than a request cancellation will be logged here.
  console.log(error);
} finally {
  // The request was successfully completed or we caught a "throw"
}
```

> [!WARNING]
> With the `isErrorNativeBehavior` flag enabled, the `finally` block will also be executed.

## 🐜 Troubleshooting

### Finally block

Many people have probably encountered the problem with the `finally` block and the classic `AbortController`. When a request is canceled, the `catch` block is called. Why would `finally` block be called? This behavior only gets in the way and causes problems.

**Example:**

```javascript
const abortController = new AbortController();

const handleLoad = async () => {
  try {
    setLoading(true);
    const users = await fetch('/api/users', { signal: abortController.signal });
    setUsers(users);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('interrupt error handling');
    }
    console.log(error);
  } finally {
    if (abortController.signal.aborted) {
      setLoading(false);
    }
  }
};

const abortLoad = () => abortController.abort();
```

The problem is obvious: checking the error by name, checking the condition to see if the `AbortController` was actually terminated in the `finally` block—it's all rather inconvenient.

How `Aborter` solves these problems:

```javascript
const aborter = new Aborter();

const handleLoad = async () => {
  try {
    setLoading(true);
    const users = await aborter.try(getUsers);
    setUsers(users);
  } catch (error) {
    if (error instanceof AbortError) return;
    console.log(error);
  } finally {
    setLoading(false);
  }
};

const abortLoad = () => aborter.abort();
```

The name check is gone, replaced by an instance check. It's easy to make a typo in the error name and not be able to fix it. With `instanceof` this problem disappears.
With the `finally` block, everything has become even simpler. The condition that checked for termination is completely gone.

> [!NOTE]
> If you do not use the `abort()` method to terminate a request, then the check for `AbortError` in the `catch` block can be excluded.

**Example:**

```javascript
const aborter = new Aborter();

const handleLoad = async () => {
  try {
    setLoading(true);
    const users = await aborter.try(getUsers);
    setUsers(users);
  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
};
```

### Subsequent calls to the `try` method

If you want to cancel a group of requests combined in `Promise.all` or `Promise.allSettled` from a single `Aborter` instance, do not use multiple sequentially called `try` methods:

```javascript
// ✖️ Bad solution
const fetchData = async () => {
  const [users, posts] = await Promise.all([
    aborter.try((signal) => axios.get('/api/users', { signal })),
    aborter.try((signal) => axios.get('/api/posts', { signal }))
  ]);
};
```

```javascript
// ✔️ Good solution
const fetchData = async () => {
  const [users, posts] = await aborter.try((signal) => {
    return Promise.all([axios.get('/api/users', { signal }), axios.get('/api/posts', { signal })]);
  });
};
```

In the case of the first solution, the second call to the `try` method will cancel the request of the first call, which will break your logic.

## 🎯 Usage Examples

### Example 1: Canceling multiple simultaneous requests

```javascript
const aborter = new Aborter();

const getCategoriesByUserId = async (userId) => {
  const data = await aborter.try(async (signal) => {
    const user = await fetch(`/api/users/${userId}`, { signal });
    const categories = await fetch(`/api/categories/${user.categoryId}`, { signal });

    return [await user.json(), await categories.json()];
  });

  return data;
};
```

### Example 2: Autocomplete

```javascript
class SearchAutocomplete {
  aborter = new Aborter();

  search = async (query) => {
    if (!query.trim()) return [];

    try {
      const results = await this.aborter.try(async (signal) => {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });

        return response.json();
      });

      this.displayResults(results);
    } catch (error) {
      // Get any error except AbortError
      console.error('Search error:', error);
    }
  };

  displayResults = (results) => {
    // Display the results
  };
}
```

### Example 3: File Upload with Cancellation

```javascript
class FileUploader {
  constructor() {
    this.aborter = new Aborter();
    this.progress = 0;
  }

  uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await this.aborter.try(async (signal) => {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          signal
        });

        // Track progress
        const reader = response.body.getReader();
        let receivedLength = 0;
        const contentLength = +response.headers.get('Content-Length');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          receivedLength += value.length;
          this.progress = Math.round((receivedLength / contentLength) * 100);
        }
      });

      console.log('File uploaded successfully');
    } catch (error) {
      if (Aborter.isError(error)) {
        console.log('Upload canceled');
      } else {
        console.error('Upload error:', error);
      }
    }
  };

  cancelUpload = () => {
    this.aborter.abort();
  };
}
```

### Example 4: Integration with UI Frameworks

**React**

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { Aborter } from 'saborter';

const DataFetcher = ({ url }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const aborterRef = useRef(new Aborter());

  useEffect(() => {
    return () => {
      aborterRef.current.abort();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await aborterRef.current.try(async (signal) => {
        const response = await fetch(url, { signal });
        return response.json();
      });
      setData(result);
    } catch (error) {
      // Handle fetch error
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = () => {
    aborterRef.current?.abort();
  };

  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Load data'}
      </button>
      <button onClick={cancelRequest} disabled={!loading}>
        Cancel
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};
```

**Vue.js**

```javascript
import { Aborter } from 'saborter';

export default {
  data() {
    return {
      aborter: null,
      data: null,
      loading: false
    };
  },
  created() {
    this.aborter = new Aborter();
  },
  beforeDestroy() {
    this.aborter.abort();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        this.data = await this.aborter.try(async (signal) => {
          const response = await fetch(this.url, { signal });
          return response.json();
        });
      } catch (error) {
        // Handle fetch errors
      } finally {
        this.loading = false;
      }
    },
    cancelRequest() {
      this.aborter.abort();
    }
  }
};
```

## 💻 Compatibility

- **Browsers:** All modern browsers that support AbortController
- **Node.js:** Requires a polyfill for AbortController (version 16+ has built-in support)
- **TypeScript:** Full type support

## 📋 License

MIT License - see [LICENSE](./LICENSE) for details.
