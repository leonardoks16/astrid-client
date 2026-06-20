# Migrating to Astrid GraphQL Client

The refactored package keeps the existing npm identity and legacy exports. New code should use an
isolated client instance.

## Configuration

Old:

```ts
await createClient({ base_url: "https://api.example.com/graphql" });

const result = await astridQuery({
  query: "...",
  variables: {},
});
```

New:

```ts
const client = createClient({
  endpoint: "https://api.example.com/graphql",
});

const result = await client.query({
  query: "...",
  variables: {},
});
```

The legacy API remains available, but `base_url` and its module-local singleton are deprecated.
Calling `createClient({ endpoint })` does not alter legacy configuration.

## Response shape

Legacy `astridQuery` and `astridMutation` return the GraphQL envelope:

```ts
const response = await astridQuery("{ viewer { id } }");
console.log(response.data);
```

Instance methods return `data` by default:

```ts
const data = await client.query({ query: "{ viewer { id } }" });
console.log(data);
```

Use `errorPolicy: "all"` to receive the envelope from an instance method.

## Errors

GraphQL errors now throw `AstridGraphQLError` by default. HTTP, network, timeout, and cancellation
failures use their corresponding structured error class. Choose `errorPolicy: "all"` or `"ignore"`
when partial GraphQL data is expected.

## Watch queries

Legacy polling used an interval that could not be stopped and resolved its Promise only once. The new
watcher starts automatically, avoids overlapping requests, and can always be stopped:

```ts
const watcher = client.watchQuery({
  query: "{ status }",
  intervalMs: 5_000,
  onData(data) {
    console.log(data);
  },
});

watcher.stop();
```

The watcher itself is also an unsubscribe function.

## Runtime configuration

The package no longer reads or writes `process.env`. Node.js 18+, browsers, and edge runtimes use
global `fetch`; other implementations can be supplied with the `fetch` option.

## Migration checklist

1. Replace `base_url` with `endpoint`.
2. Store the returned client and call `client.query`, `client.mutation`, or `client.request`.
3. Update code that reads `response.data` because modern methods return `data` directly.
4. Select an error policy and handle the structured errors relevant to the application.
5. Stop every watcher when its consumer is disposed.
6. Opt mutations into retries only when duplicate execution is safe.
