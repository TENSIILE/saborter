# Documentation for development functionality

## 📖 Overview

This document describes utilities designed for development and debugging purposes.
They control logging behavior and allow you to enhance error stack traces with additional debugging information.

## 🔧 API

### Import

```javascript
import { setLoggerMode, setDebugErrorStackMode } from 'saborter/dev';
```

### `setLoggerMode`

Sets the global logging mode for the application.
This function updates internal flags that determine whether logging is enabled and whether informational logs should be suppressed.

**Parameters:**

- `enabled: boolean` - If `true`, logging is globally enabled; if `false`, logging is disabled.
- `options?: Object` - Additional configuration.
  - `skipInfo: boolean` (default `false`): If `true`, `info`-level logs are skipped even when logging is enabled. If `false`, all log levels are allowed.

**Example:**

```typescript
// Enable logging but skip info messages
setLoggerMode(true, { skipInfo: true });

// Disable all logging
setLoggerMode(false);
```

### `setDebugErrorStackMode`

Enables or disables the inclusion of debug information in error stack traces for classes that extend `ExtendedStackError`.

**Parameters:**

- `enabled: boolean` - If `true`, debug stack expansion is enabled; if `false`, it is disabled. The default is `false`.

**Example:**

```typescript
// Enable debug stack information
setDebugErrorStackMode(true);
```
