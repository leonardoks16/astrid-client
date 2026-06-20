import { createClient } from "../src";

const client = createClient({ endpoint: "/graphql", credentials: "include" });

async function loadViewer(): Promise<void> {
  const data = await client.query<{ viewer: { name: string } }>({
    query: `{ viewer { name } }`,
  });
  const output = document.querySelector("[data-viewer]");
  if (output) output.textContent = data.viewer.name;
}

document.querySelector("button[data-load-viewer]")?.addEventListener("click", () => {
  void loadViewer();
});
