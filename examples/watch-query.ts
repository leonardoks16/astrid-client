import { createClient } from "../src";

const client = createClient({ endpoint: "https://api.example.com/graphql" });
const watcher = client.watchQuery<{ status: string }>({
  query: `{ status }`,
  intervalMs: 5_000,
  onData(data) {
    console.log(data.status);
  },
  onError(error) {
    console.error(error);
  },
});

setTimeout(() => watcher.stop(), 30_000);
