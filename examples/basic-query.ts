import { createClient } from "../src";

const client = createClient({ endpoint: "https://api.example.com/graphql" });

const data = await client.query<{ viewer: { id: string; name: string } }>({
  query: `query Viewer { viewer { id name } }`,
});

console.log(data.viewer.name);
