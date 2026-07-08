# ApigError client

## The `ApigError` class

When `errorHandling` is enabled (the default, `true`), apig generates an `ApigError` class directly into your output directory — into a `config.ts` file. This is **not** an export from the `@travjek/apig` package — it's generated code that lives alongside your SDK.

```ts
// generated ./src/api/config.ts
export class ApigError<T = unknown> extends Error {
  status: number
  body: T
  constructor(status: number, body: T) {
    super(`ApigError ${status}`)
    this.name = 'ApigError'
    this.status = status
    this.body = body
  }
}
```

Generated SDK functions throw this class on non-2xx responses.

### Catching errors

```ts
import { ApigError } from './api/config'
import { getUser } from './api/sdk'

try {
  const user = await getUser('123')
} catch (e) {
  if (e instanceof ApigError) {
    console.log(e.status) // 404
    console.log(e.body)   // the server's response body
  }
}
```

## `@travjek/apig/client`

A small runtime library with type-safe guard functions — useful when importing the generated `ApigError` class directly is inconvenient (e.g. from shared utilities outside the output directory).

```ts
import { isApigError, isApigStatus } from '@travjek/apig/client'
import type { ApigErrorLike } from '@travjek/apig/client'
```

### `isApigError(error)`

Checks that an error was thrown by a generated SDK (by `error.name === 'ApigError'`), without importing the concrete class:

```ts
import { isApigError } from '@travjek/apig/client'

try {
  await getUser('123')
} catch (e) {
  if (isApigError(e)) {
    console.log(e.status)
    console.log(e.body)
  }
}
```

### `isApigStatus(error, status)`

Checks the error and a specific HTTP status in one call:

```ts
import { isApigStatus } from '@travjek/apig/client'

const { data, error } = useGetUserQuery('123')

if (isApigStatus(error, 404)) return <NotFound />
if (isApigStatus(error, 403)) return <Forbidden />
```

## Custom error class

You can replace the `ApigError` class with your own via `defineConfig`:

```ts
defineConfig({
  errorHandling: { path: './lib/MyCustomError', export: 'MyCustomError' },
  plugins: [sdk()],
})
```

Generated functions will throw `MyCustomError` instead of `ApigError`. The class must be importable from the given path.

## Disabling error handling

```ts
defineConfig({
  errorHandling: false,
  plugins: [sdk()],
})
```

Generated functions won't wrap errors — `fetch`/`axios`/etc. propagate exceptions as-is.
