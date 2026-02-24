# 🚙 Migrating from version 1.x to 2.x

Version 2.0 of the `saborter` library introduces several significant changes aimed at improving the architecture, expanding capabilities, and simplifying usage. This guide describes all breaking changes and provides step‑by‑step instructions for updating your code.

## 📖 Overview of Changes

- Deprecated static methods and fields of the `Aborter` class have been removed.
- Error structure has changed: the `code` and `signal` fields have been removed from `AbortError`.
- The instance method dispose has been replaced by a standalone function.
- The `isAborted` field has been renamed to `aborted`.
- All package errors are now imported from the separate subpath `saborter/errors`.

## 👣 Step‑by‑Step Migration

### 1. Static Method `Aborter.isError` -> Function `isAbortError`

**Before:**

```typescript
import { Aborter } from 'saborter';

try {
  // ...
} catch (error) {
  if (Aborter.isError(error)) {
    // handle abort error
  }
}
```

**After:**

```typescript
import { isAbortError } from 'saborter/lib';

try {
  // ...
} catch (error) {
  if (isAbortError(error)) {
    // handle abort error
  }
}
```

**Note:** The `isAbortError` function is now exported from the main module, not from the lib subpath.

### 2. Static Field `Aborter.errorName` Removed

Previously this field was used to obtain the error name. Now, to check the error type, use `isAbortError` or `instanceof AbortError`.

### 3. `code` and `signal` Fields Removed from `AbortError`

In version 2.0, the `AbortError` object no longer contains `code` and `signal` fields. Instead:

- To get the abort reason, use the cause field (if the error was caused by another error) or the message field.
- To access the associated signal, pass it separately in your code if needed.

If your logic relied on the `code` field, reconsider your approach: errors are now distinguished by their constructor (`AbortError`, `TimeoutError`) or by the content of `cause`.

### 4. Instance Method dispose -> Standalone Function dispose

**Before:**

```typescript
import { Aborter } from 'saborter';

const aborter = new Aborter();
// ... usage
aborter.dispose();
```

**After:**

```typescript
import { Aborter } from 'saborter';
import { dispose } from 'saborter/lib';

const aborter = new Aborter();
// ... usage
dispose(aborter);
```

### 5. Field `isAborted` Renamed to `aborted`

**Before:**

```typescript
if (aborter.isAborted) {
  // ...
}
```

**After:**

```typescript
if (aborter.aborted) {
  // ...
}
```

This change aligns naming with the native `AbortSignal.aborted`.

### 6. Error Imports Moved to a Separate Subpath

All error classes (`AbortError`, `TimeoutError`) are no longer exported from the main module. Import them from `saborter/errors`.

**Before:**

```typescript
import { AbortError, TimeoutError } from 'saborter';
```

**After:**

```typescript
import { AbortError, TimeoutError } from 'saborter/errors';
```

## ⚡ Why These Changes Were Made

- **API Simplification** - Removing deprecated methods and fields reduces the API surface and decreases the likelihood of incorrect usage.
- **Consistency** - Renaming `isAborted` to `aborted` aligns with the native AbortSignal.
- **Clear Separation of Concerns** - Moving errors to a separate module avoids circular dependencies and improves tree‑shaking.
- **Preparation for Expansion** - The new error structure (with the `metadata` field) provides more flexibility for passing additional information.

## ✨ What's New in Version 2.0

Although this guide focuses on migration, it's worth noting new features that can simplify your code:

- `ReusableAborter` - a reusable aborter that automatically restores event listeners.
- **Automatic data unpacking from** `fetch()` - the `aborter.try()` method can now directly return the result of a request.
- `metadata` **field in errors** - allows you to pass arbitrary data along with an abort error.
- **Many new utilities** - `debounce`, `catchAbortError`, `setTimeoutAsync`, `throwIfAborted`, and more.

Details about the new features can be found in the [main documentation](./readme.md).

## 📚 Additional Resources

- [Full Changelog (CHANGELOG.md)](./CHANGELOG.md)
- [Documentation for new utilities](./docs/libs.md)
- [Documentation for ReusableAborter](./docs/reusable-aborter.md)

If you have questions or encounter issues during the update, please create an issue in the [GitHub repository](https://github.com/TENSIILE/saborter) or contact our support chat.
