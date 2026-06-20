import { createClient } from "../src";

async function getAccessToken(): Promise<string> {
  return await Promise.resolve("application-managed-token");
}

const client = createClient({
  endpoint: "https://api.example.com/graphql",
  headers: async () => ({ Authorization: `Bearer ${await getAccessToken()}` }),
});

await client.query({ query: `{ viewer { id } }` });
