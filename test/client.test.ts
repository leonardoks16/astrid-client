import { describe, expect, it, vi } from "vitest";
import { AstridGraphQLClient, createClient } from "../src";
import type { AstridResponseContext } from "../src";
import { jsonResponse, mockFetch } from "./helpers";

function requestBody(fetch: ReturnType<typeof mockFetch>, index = 0): string {
  const body = fetch.mock.calls[index]?.[1]?.body;
  if (typeof body !== "string") throw new TypeError("Expected a string request body.");
  return body;
}

describe("AstridGraphQLClient", () => {
  it("creates a client through the class and factory", () => {
    const fetch = mockFetch();
    expect(new AstridGraphQLClient({ endpoint: "/graphql", fetch })).toBeInstanceOf(
      AstridGraphQLClient,
    );
    expect(createClient({ endpoint: "/graphql", fetch })).toBeInstanceOf(AstridGraphQLClient);
  });

  it("returns an envelope when the client-wide error policy is all", async () => {
    const fetch = mockFetch(jsonResponse({ data: { ok: true } }));
    const client = createClient({ endpoint: "/graphql", fetch, errorPolicy: "all" });
    const response = await client.query<{ ok: boolean }>({ query: "{ ok }" });

    expect(response.data?.ok).toBe(true);
  });

  it("sends query variables and an operation name", async () => {
    const fetch = mockFetch(jsonResponse({ data: { user: { id: "123" } } }));
    const client = createClient({ endpoint: "https://example.test/graphql", fetch });

    await expect(
      client.query<{ user: { id: string } }, { id: string }>({
        query: "query User($id: ID!) { user(id: $id) { id } }",
        variables: { id: "123" },
        operationName: "User",
      }),
    ).resolves.toEqual({ user: { id: "123" } });

    expect(fetch).toHaveBeenCalledOnce();
    expect(JSON.parse(requestBody(fetch))).toEqual({
      query: "query User($id: ID!) { user(id: $id) { id } }",
      variables: { id: "123" },
      operationName: "User",
    });
  });

  it("sends mutations with the GraphQL query field", async () => {
    const fetch = mockFetch(jsonResponse({ data: { createPost: { id: "1" } } }));
    const client = createClient({ endpoint: "/graphql", fetch });
    await client.mutation({ mutation: "mutation { createPost { id } }" });

    expect(JSON.parse(requestBody(fetch))).toMatchObject({
      query: "mutation { createPost { id } }",
    });
  });

  it("resolves dynamic headers for every request and supports header mutation", async () => {
    const fetch = mockFetch(jsonResponse({ data: {} }), jsonResponse({ data: {} }));
    const token = vi.fn().mockResolvedValueOnce("one").mockResolvedValueOnce("two");
    const client = createClient({
      endpoint: "/graphql",
      fetch,
      headers: async () => ({ authorization: `Bearer ${await token()}`, "x-static": "yes" }),
    });
    client.setHeader("x-client", "set").removeHeader("x-static");

    await client.query({ query: "{ viewer { id } }" });
    client.setHeaders({ "x-more": "value" });
    await client.query({ query: "{ viewer { id } }" });

    const firstHeaders = new Headers(fetch.mock.calls[0]?.[1]?.headers);
    const secondHeaders = new Headers(fetch.mock.calls[1]?.[1]?.headers);
    expect(firstHeaders.get("authorization")).toBe("Bearer one");
    expect(firstHeaders.get("x-client")).toBe("set");
    expect(firstHeaders.has("x-static")).toBe(false);
    expect(secondHeaders.get("authorization")).toBe("Bearer two");
    expect(secondHeaders.get("x-more")).toBe("value");
  });

  it("includes persisted query metadata", async () => {
    const fetch = mockFetch(jsonResponse({ data: { viewer: null } }));
    const client = createClient({ endpoint: "/graphql", fetch });
    await client.request({
      document: "query Viewer { viewer { id } }",
      persistedQuery: { sha256Hash: "abc" },
    });

    const body = JSON.parse(requestBody(fetch)) as { extensions?: unknown };
    expect(body.extensions).toEqual({ persistedQuery: { version: 1, sha256Hash: "abc" } });
  });

  it("calls request and response hooks without exposing headers by default", async () => {
    const onRequest = vi.fn();
    const onResponse = vi.fn<(context: AstridResponseContext<object>) => void>();
    const fetch = mockFetch(jsonResponse({ data: { ok: true } }));
    const client = createClient({ endpoint: "/graphql", fetch, onRequest, onResponse });
    await client.query({ query: "{ ok }" });

    expect(onRequest).toHaveBeenCalledOnce();
    expect(onResponse).toHaveBeenCalledOnce();
    expect(onResponse.mock.calls[0]?.[0].response).toBeInstanceOf(Response);
  });
});
