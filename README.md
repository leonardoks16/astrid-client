# Astrid GraphQL Client

A lightweight, typed, runtime-agnostic GraphQL client for browsers, Node.js, and edge environments.

Astrid GraphQL Client is a small GraphQL HTTP transport for applications, services, scripts, CLIs,
and edge workers. It provides direct control over requests without a normalized cache or framework
runtime.

## Features

- Queries and mutations over HTTP
- Typed responses and variables with TypeScript generics
- Browser, Node.js 18+, Bun, Deno, and edge-runtime support
- Global or injected `fetch`
- Static, dynamic, and mutable headers
- Request timeouts and external abort signals
- Configurable retry with jitter
- Structured HTTP, GraphQL, network, timeout, and abort errors
- Polling-based watch queries
- Request, response, and error hooks
- GraphQL persisted-query metadata
- Legacy `astridQuery`, `astridMutation`, and `astridWatchQuery` compatibility
- ESM and CommonJS builds with declarations and source maps
- No runtime dependencies

## Installation

```bash
npm install @leonardoks16/astrid-client
```

The scoped npm name is retained because it is the identity of the existing published package. The
project's public-facing name is Astrid GraphQL Client.

## Quick start

```ts
import { createClient } from "@leonardoks16/astrid-client";

const client = createClient({
  endpoint: "https://api.example.com/graphql",
});

const data = await client.query({
  query: `
    query Viewer {
      viewer {
        id
        name
      }
    }
  `,
});
```

Modern methods return the GraphQL `data` value by default.

## Queries

```ts
const data = await client.query({
  query: `query Posts { posts { id title } }`,
  operationName: "Posts",
});
```

## Mutations

```ts
const data = await client.mutation({
  mutation: `
    mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) { id title }
    }
  `,
  variables: { input: { title: "Hello" } },
});
```

Configured automatic retries do not apply to mutations by default. Set `retryMutations: true` on the
client, or set `retries` on a particular mutation, only when duplicate execution is safe.

## Variables

Variables are serialized into the JSON request body without transformation.

```ts
await client.query({
  query: `query User($id: ID!) { user(id: $id) { id name } }`,
  variables: { id: "123" },
});
```

## TypeScript generics

The first generic describes response data; the second describes variables.

```ts
type GetUserData = { user: { id: string; name: string } };
type GetUserVariables = { id: string };

const result = await client.query<GetUserData, GetUserVariables>({
  query: `query GetUser($id: ID!) { user(id: $id) { id name } }`,
  variables: { id: "123" },
});

console.log(result.user.name);
```

The package also works from plain JavaScript; all type parameters are optional.

## Headers and authentication

```ts
const client = createClient({
  endpoint: "https://api.example.com/graphql",
  headers: { Authorization: "Bearer token" },
});

client.setHeader("x-trace-id", "trace-1");
client.setHeaders({ "x-client-version": "2" });
client.removeHeader("x-trace-id");
```

Request-specific `headers` can also be supplied to `query`, `mutation`, or `request`. Astrid never
logs headers automatically or includes them in its error messages.

## Dynamic authentication token

Header providers run before every attempt and may be asynchronous.

```ts
const client = createClient({
  endpoint: "https://api.example.com/graphql",
  headers: async () => ({
    Authorization: `Bearer ${await getAccessToken()}`,
  }),
});
```

## Timeout and cancellation

The default timeout is 30 seconds. Set `timeoutMs: 0` to disable it.

```ts
const controller = new AbortController();
const request = client.query({
  query: `{ viewer { id } }`,
  timeoutMs: 10_000,
  signal: controller.signal,
});

controller.abort();
await request;
```

Timeouts throw `AstridTimeoutError`; external cancellation throws `AstridAbortError`.

## Retry

```ts
const client = createClient({
  endpoint: "https://api.example.com/graphql",
  retries: 2,
  retryDelayMs: 300,
  retryStrategy: "exponential",
});
```

Retries apply to network failures, timeouts, and HTTP 408, 429, 500, 502, 503, and 504 responses.
Delays include bounded jitter. GraphQL errors are not retried. `retries` is the number of additional
attempts, not the total request count.

## Error handling

```ts
import {
  AstridAbortError,
  AstridGraphQLError,
  AstridHTTPError,
  AstridNetworkError,
  AstridTimeoutError,
} from "@leonardoks16/astrid-client";

try {
  await client.query({ query: `{ viewer { id } }` });
} catch (error) {
  if (error instanceof AstridGraphQLError) {
    console.error(error.errors, error.data, error.status);
  } else if (error instanceof AstridHTTPError) {
    console.error(error.status, error.body);
  }
}
```

`AstridGraphQLError` preserves all GraphQL errors, partial data, the parsed original response, the
Fetch `Response`, status, and the first error's locations, path, and extensions.

## Error policy

The client default is `"throw"`. It can be set globally or per request.

| Policy     | GraphQL response containing errors                       |
| ---------- | -------------------------------------------------------- |
| `"throw"`  | Throws `AstridGraphQLError`                              |
| `"all"`    | Returns `{ data, errors, extensions }`                   |
| `"ignore"` | Returns `data` and ignores the GraphQL `errors` property |

```ts
const response = await client.query({
  query: `{ viewer { id } }`,
  errorPolicy: "all",
});

console.log(response.data, response.errors);
```

HTTP, network, timeout, and abort failures still throw under every error policy.

## Watch queries and polling

Watchers start automatically. Polls are scheduled after the preceding request finishes, so slow
requests never overlap.

```ts
const watcher = client.watchQuery<{ viewer: { id: string } }>({
  query: `{ viewer { id } }`,
  intervalMs: 5_000,
  immediate: true,
  onData(data) {
    console.log(data.viewer.id);
  },
  onError(error) {
    console.error(error);
  },
});

watcher.stop();
watcher.start();
await watcher.refetch();
console.log(watcher.isRunning());

// A watcher is also an unsubscribe function.
watcher(); // -> Unsubscribes
```

Stopping a watcher clears its timer and aborts its active request.

## Custom fetch

The runtime's global `fetch` is used by default. Injection supports tests and runtimes with custom
transport behavior.

```ts
const client = createClient({
  endpoint: "https://api.example.com/graphql",
  fetch: customFetch,
});
```

## Browser usage

Use the package through an ESM-aware bundler. No Node.js globals or forbidden request headers are
used.

```ts
import { createClient } from "@leonardoks16/astrid-client";

const client = createClient({ endpoint: "/graphql", credentials: "include" });
const data = await client.query({ query: `{ viewer { id } }` });
```

## Node.js usage

Node.js 18 and newer provide the required Fetch APIs globally.

```ts
import { createClient } from "@leonardoks16/astrid-client";

const client = createClient({ endpoint: process.env.GRAPHQL_ENDPOINT! });
const data = await client.query({ query: `{ health }` });
```

Environment variables are application concerns; Astrid does not read or modify them.

## Edge runtime usage

The same API works in Fetch-compatible workers. Pass request-derived headers dynamically when
needed. The core has no dependency on Node.js modules.

```ts
export default {
  async fetch(request: Request): Promise<Response> {
    const client = createClient({
      endpoint: "https://api.example.com/graphql",
      headers: { "x-request-id": request.headers.get("x-request-id") ?? "unknown" },
    });
    return Response.json(await client.query({ query: `{ status }` }));
  },
};
```

## Generic request and persisted queries

```ts
const data = await client.request({
  document: `query Viewer { viewer { id } }`,
  operationName: "Viewer",
  persistedQuery: { sha256Hash: "hex-encoded-sha256" },
});
```

Persisted-query metadata follows Apollo's `extensions.persistedQuery` request shape. Astrid does not
calculate hashes or implement automatic hash negotiation.

## Hooks

`onRequest`, `onResponse`, and `onError` may be synchronous or asynchronous. Response hooks receive
a cloned `Response`, so reading it does not consume the body used by the client. Hooks are suitable
for tracing, metrics, debugging, and application-controlled auth refresh.

## Legacy API compatibility

```ts
import {
  astridMutation,
  astridQuery,
  astridWatchQuery,
  createClient,
} from "@leonardoks16/astrid-client";

await createClient({ base_url: "https://api.example.com/graphql" });
const response = await astridQuery({ query: `{ viewer { id } }`, variables: {} });
```

Legacy query and mutation helpers preserve the raw GraphQL response envelope. Legacy
`astridWatchQuery` returns the new leak-free watcher. Only `createClient({ base_url })` writes the
module-local compatibility singleton; modern `createClient({ endpoint })` instances are isolated.

## Migrating from old Astrid Client

Prefer an instance and call methods on it:

```ts
// Old
await createClient({ base_url: "https://api.example.com/graphql" });
const oldResponse = await astridQuery({ query: "...", variables: {} });

// New
const client = createClient({ endpoint: "https://api.example.com/graphql" });
const data = await client.query({ query: "...", variables: {} });
```

See [docs/MIGRATION.md](docs/MIGRATION.md) for behavior changes and a migration checklist.

## API reference

- `new AstridGraphQLClient(options)` creates an isolated client.
- `createClient(options)` is the preferred factory.
- `client.request(options)` sends a generic GraphQL document.
- `client.query(options)` and `client.mutation(options)` provide named helpers.
- `client.watchQuery(options)` creates an automatically started watcher.
- `client.setHeader`, `setHeaders`, and `removeHeader` update instance headers.
- `astridQuery`, `astridMutation`, and `astridWatchQuery` are compatibility helpers.

Complete option and error-class details are in [docs/API.md](docs/API.md).

## Scope and current limitations

Astrid is a GraphQL transport client, not a full Apollo replacement. It does not include a normalized
cache, schema awareness, query parsing, or framework state bindings.

- Request batching is not implemented. Each operation is sent as an independent HTTP request.
- Multipart file uploads are not implemented. Use an injected fetch wrapper if an application needs
  the GraphQL multipart request specification today.
- Astrid GraphQL Client currently supports HTTP queries, mutations, and polling-based watch queries.
  Native GraphQL subscriptions are planned but not implemented yet.

These boundaries are intentional; no partial batching, upload, or WebSocket API is exposed.

## Development

Requires Node.js 18 or newer.

```bash
npm install
npm run lint
npm run typecheck
npm test
```

## Build

```bash
npm run build
```

The build emits ESM, CommonJS, declarations, and source maps into `dist/`.

## Test

```bash
npm test
npm run test:watch
```

Unit tests use mocked fetch implementations and do not require a GraphQL server.

## Publishing

Before publishing, update the version and changelog, then inspect the package:

```bash
npm run prepublishOnly
npm pack --dry-run
npm publish --access public
```

Publishing requires authorization for the `@leonardoks16` npm scope. A GitHub release can also run
the included trusted publishing workflow when `NPM_TOKEN` is configured.

## License

[MIT](LICENSE) © 2021-present Leonardo Kwieczinski Sampaio.
