# API reference

## `AstridGraphQLClient` and `createClient`

`createClient(options)` returns a new `AstridGraphQLClient`. The class constructor accepts the same
options.

### Client options

| Option           | Type                                          | Default         |
| ---------------- | --------------------------------------------- | --------------- |
| `endpoint`       | `string`                                      | required        |
| `headers`        | `HeadersInit \| () => HeadersInit \| Promise` | none            |
| `fetch`          | Fetch-compatible function                     | global `fetch`  |
| `timeoutMs`      | `number`                                      | `30000`         |
| `retries`        | `number`                                      | `0`             |
| `retryDelayMs`   | `number`                                      | `300`           |
| `retryStrategy`  | `"linear" \| "exponential"`                   | `"exponential"` |
| `retryMutations` | `boolean`                                     | `false`         |
| `credentials`    | `RequestCredentials`                          | Fetch default   |
| `mode`           | `RequestMode`                                 | Fetch default   |
| `cache`          | `RequestCache`                                | Fetch default   |
| `errorPolicy`    | `"throw" \| "all" \| "ignore"`                | `"throw"`       |
| `onRequest`      | async-capable hook                            | none            |
| `onResponse`     | async-capable hook                            | none            |
| `onError`        | async-capable hook                            | none            |

Values for timeout and delay must be non-negative. Retry counts must be non-negative integers.

## Request methods

### `client.request(options)`

Sends `options.document`. It also accepts `variables`, `operationName`, `headers`, `signal`, timeout,
retry and error-policy overrides, and `persistedQuery: { sha256Hash }`.

### `client.query(options)`

Equivalent to `request`, using the `query` property. Configured retries apply.

### `client.mutation(options)`

Equivalent to `request`, using the `mutation` property. Client-level retries are disabled for this
method unless `retryMutations` is true. An explicit per-mutation `retries` value always applies.

## Headers

- `setHeader(name, value)` assigns or replaces an instance header and returns the client.
- `setHeaders(headers)` merges instance headers and returns the client.
- `removeHeader(name)` removes static or dynamic headers by name and returns the client.

Request headers have the highest precedence, followed by assigned instance headers, followed by the
configured static or dynamic provider.

## Watcher

`client.watchQuery(options)` starts and returns an `AstridWatcher` with `start()`, `stop()`,
`refetch()`, and `isRunning()`. Calling the watcher itself invokes `stop()`.

Options include query options plus `intervalMs` (default 5000), `immediate` (default true), `onData`,
and `onError`.

## Errors

- `AstridError` is the common base and exposes a stable `code`.
- `AstridNetworkError` represents fetch and invalid-response failures.
- `AstridHTTPError` exposes `status`, `statusText`, `response`, and parsed `body`.
- `AstridGraphQLError` exposes `errors`, partial `data`, `originalResponse`, `response`, `status`, and
  first-error `locations`, `path`, and `extensions`.
- `AstridTimeoutError` exposes `timeoutMs`.
- `AstridAbortError` exposes the abort `reason` when available.

Errors never include request headers or tokens unless application code explicitly adds them.

## Legacy exports

`astridQuery`, `astridMutation`, and `astridWatchQuery` require prior configuration with
`createClient({ base_url })`. They are compatibility APIs; new code should use instance methods.
