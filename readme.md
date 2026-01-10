![Logo](./assets/logo.png)

[![Npm package](https://img.shields.io/badge/npm%20package-1.2.0-red)](https://www.npmjs.com/package/saborter)
![Static Badge](https://img.shields.io/badge/coverage-100%25-orange)
![Static Badge](https://img.shields.io/badge/license-MIT-blue)
[![Github](https://img.shields.io/badge/repository-github-color)](https://github.com/TENSIILE/saborter)

A simple and effective library for canceling asynchronous requests using AbortController.

## 📦 Installation

```bash
npm install saborter
# or
yarn add saborter
```

## 🚀 Quick Start

### Basic Usage

```javascript
import { Aborter } from 'saborter';

// Create an Aborter instance
const aborter = new Aborter();

// Use for the request
async function fetchData() {
  try {
    const result = await aborter.try((signal) => fetch('/api/data', { signal }));
    console.log('Data received:', result);
  } catch (error) {
    console.error('Request error:', error);
  }
}
```

## 📖 Key Features

### 1. Canceling Requests

The `Aborter` class allows you to easily cancel ongoing requests:

```javascript
const aborter = new Aborter();

// Start a long-running request
const longRequest = aborter.try((signal) => fetch('/api/long-task', { signal }));

// Cancel the request after 2 seconds
setTimeout(() => {
  aborter.abort();
  console.log('Request canceled');
}, 2000);
```

### 2. Automatically canceling previous requests

Each time `try()` is called, the previous request is automatically canceled:

```javascript
// When searching with autocomplete
async function handleSearch(query) {
  // The previous request is automatically canceled
  const results = await aborter.try((signal) => fetch(`/api/search?q=${query}`, { signal }));
  return results;
}

// When the user quickly types:
handleSearch('a'); // Starts
handleSearch('ab'); // The first request is canceled, a new one is started
handleSearch('abc'); // The second request is canceled, a new one is started
```

### 3. Working with Multiple Requests

You can create separate instances for different groups of requests:

```javascript
// Separate requests by type
const userAborter = new Aborter();
const dataAborter = new Aborter();

// Manage user requests separately
async function fetchUser(id) {
  return userAborter.try((signal) => fetch(`/api/users/${id}`, { signal }));
}

// And manage data separately
async function fetchData(params) {
  return dataAborter.try((signal) => fetch('/api/data', { signal, ...params }));
}

// Cancel only user requests
function cancelUserRequests() {
  userAborter.abort();
}
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
  */
  onabort?: OnAbortCallback;
}
```

### Properties

`signal`

Returns the `AbortSignal` associated with the current controller.

```javascript
const aborter = new Aborter();

// Using signal in the request
fetch('/api/data', {
  signal: aborter.signal
});
```

`listeners`

Returns an `EventListener` object to listen for `Aborter` events.

[Detailed documentation here](./docs/event-listener.md)

`static errorName`

Name of the `AbortError` error instance thrown by AbortSignal.

```javascript
const result = await aborter
  .try((signal) => fetch('/api/data', { signal }), { isErrorNativeBehavior: true })
  .catch((error) => {
    if (error.name === Aborter.errorName) {
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

`abort(reason?)`

**Parameters:**

- `reason?: any` - the reason for aborting the request (optional)

Immediately cancels the currently executing request.

```javascript
// Start the request
const requestPromise = aborter.try((signal) => fetch('/api/data', { signal }), { isErrorNativeBehavior: true });

// Cancel
aborter.abort();

// Handle cancellation
requestPromise.catch((error) => {
  if (error.name === 'AbortError') {
    console.log('Request canceled');
  }
});
```

`abortWithRecovery(reason?)`

Immediately cancels the currently executing request.
After aborting, it restores the `AbortSignal`, resetting the `isAborted` property, and interaction with the `signal` property becomes available again.

**Parameters:**

- `reason?: any` - the reason for aborting the request (optional)

**Returns:** `AbortController`

```javascript
// Create an Aborter instance
const aborter = new Aborter();

// Data retrieval function
async function fetchData() {
  try {
    const data = await fetch('/api/data', { signal: aborter.signal });
  } catch (error) {
    // Any error, except AbortError, will go here
    console.log(error);
  }
}

// Calling a function with a request
fetchData();

// We interrupt the request and then restore the signal
aborter.abortWithRecovery();

// Call the function again
fetchData();
```

`static isError(error)`

Static method for checking if an object is an `AbortError` error.

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
```

## 🔌 Additional APIs

- [**AbortError**](./docs/abort-error.md) - Custom error for working with Aborter.

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

### Finally block

By ignoring `AbortError` errors, the `finally` block will only be executed if other errors are received or if the request is successful.

```javascript
const result = await aborter
  .try((signal) => fetch('/api/data', { signal }))
  .catch((error) => {
    // Any error, except AbortError, will go here
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
  // Any error, except AbortError, will go here
  console.log(error);
} finally {
  // The request was successfully completed or we caught a "throw"
}
```

#### ⚠️ Attention!

With the `isErrorNativeBehavior` flag enabled, the `finally` block will also be executed.

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

## 🎯 Usage Examples

### Example 1: Autocomplete

```javascript
class SearchAutocomplete {
  aborter = new Aborter();

  async search(query) {
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
  }

  displayResults(results) {
    // Display the results
  }
}
```

### Example 2: File Upload with Cancellation

```javascript
class FileUploader {
  constructor() {
    this.aborter = new Aborter();
    this.progress = 0;
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await this.aborter.try(
        async (signal) => {
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
        },
        { isErrorNativeBehavior: true }
      );

      console.log('File uploaded successfully');
    } catch (error) {
      if (Aborter.isError(error)) {
        console.log('Upload canceled');
      } else {
        console.error('Upload error:', error);
      }
    }
  }

  cancelUpload() {
    this.aborter.abort();
  }
}
```

### Example 3: Integration with UI Frameworks

**React**

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { Aborter } from 'saborter';

function DataFetcher({ url }) {
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
    if (aborterRef.current) {
      aborterRef.current.abort();
    }
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
}
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
