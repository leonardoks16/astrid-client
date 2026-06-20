import { createClient } from "../src";

// Applications may read this value from their own environment or configuration system.
const client = createClient({ endpoint: "https://api.example.com/graphql" });
console.log(await client.query({ query: `{ health }` }));
