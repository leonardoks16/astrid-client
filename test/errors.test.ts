import { describe, expect, it, vi } from "vitest";
import {
  AstridGraphQLError,
  AstridHTTPError,
  AstridNetworkError,
  AstridTimeoutError,
  createClient,
} from "../src";
import { jsonResponse, mockFetch } from "./helpers";

describe("errors and policies", () => {
  it("throws an HTTP error with status and parsed body", async () => {
    const fetch = mockFetch(jsonResponse({ message: "unavailable" }, { status: 503 }));
    const client = createClient({ endpoint: "/graphql", fetch });
    const error = await client
      .query({ query: "{ viewer { id } }" })
      .catch((value: unknown) => value);

    expect(error).toBeInstanceOf(AstridHTTPError);
    expect(error).toMatchObject({ status: 503, body: { message: "unavailable" } });
  });

  it("throws a GraphQL error preserving details and the original response", async () => {
    const payload = {
      data: { viewer: null },
      errors: [
        {
          message: "Forbidden",
          locations: [{ line: 1, column: 2 }],
          path: ["viewer"],
          extensions: { code: "FORBIDDEN" },
        },
      ],
    };
    const client = createClient({ endpoint: "/graphql", fetch: mockFetch(jsonResponse(payload)) });
    const error = await client
      .query({ query: "{ viewer { id } }" })
      .catch((value: unknown) => value);

    expect(error).toBeInstanceOf(AstridGraphQLError);
    expect(error).toMatchObject({
      message: "Forbidden",
      status: 200,
      path: ["viewer"],
      extensions: { code: "FORBIDDEN" },
      originalResponse: payload,
    });
  });

  it("returns the full envelope with errorPolicy all", async () => {
    const payload = { data: { viewer: null }, errors: [{ message: "partial" }] };
    const client = createClient({ endpoint: "/graphql", fetch: mockFetch(jsonResponse(payload)) });
    await expect(client.query({ query: "{ viewer { id } }", errorPolicy: "all" })).resolves.toEqual(
      payload,
    );
  });

  it("returns data and ignores GraphQL errors with errorPolicy ignore", async () => {
    const payload = { data: { viewer: null }, errors: [{ message: "partial" }] };
    const client = createClient({ endpoint: "/graphql", fetch: mockFetch(jsonResponse(payload)) });
    await expect(
      client.query({ query: "{ viewer { id } }", errorPolicy: "ignore" }),
    ).resolves.toEqual({ viewer: null });
  });

  it("retries network errors and transient HTTP responses", async () => {
    const fetch = vi
      .fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(jsonResponse({}, { status: 429 }))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));
    const client = createClient({ endpoint: "/graphql", fetch, retries: 2, retryDelayMs: 0 });

    await expect(client.query({ query: "{ ok }" })).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("does not retry mutations unless explicitly enabled", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("offline"));
    const client = createClient({ endpoint: "/graphql", fetch, retries: 2, retryDelayMs: 0 });

    await expect(client.mutation({ mutation: "mutation { send }" })).rejects.toBeInstanceOf(
      AstridNetworkError,
    );
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("throws a timeout error", async () => {
    const fetch = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    const client = createClient({ endpoint: "/graphql", fetch, timeoutMs: 5 });
    await expect(client.query({ query: "{ slow }" })).rejects.toBeInstanceOf(AstridTimeoutError);
  });

  it("distinguishes an external abort from a timeout", async () => {
    const controller = new AbortController();
    const fetch = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    const client = createClient({ endpoint: "/graphql", fetch });
    const request = client.query({ query: "{ slow }", signal: controller.signal });
    controller.abort("cancelled");
    await expect(request).rejects.toMatchObject({
      name: "AstridAbortError",
      reason: "cancelled",
    });
  });
});
