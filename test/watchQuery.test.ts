import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../src";
import { jsonResponse, mockFetch } from "./helpers";

describe("watchQuery", () => {
  afterEach(() => vi.useRealTimers());

  it("starts immediately, polls, stops, and is callable as unsubscribe", async () => {
    vi.useFakeTimers();
    const fetch = mockFetch(
      jsonResponse({ data: { count: 1 } }),
      jsonResponse({ data: { count: 2 } }),
    );
    const onData = vi.fn();
    const client = createClient({ endpoint: "/graphql", fetch });
    const watcher = client.watchQuery({ query: "{ count }", intervalMs: 100, onData });

    expect(watcher.isRunning()).toBe(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(onData).toHaveBeenCalledWith({ count: 1 });
    await vi.advanceTimersByTimeAsync(100);
    expect(onData).toHaveBeenCalledWith({ count: 2 });

    watcher();
    expect(watcher.isRunning()).toBe(false);
    await vi.advanceTimersByTimeAsync(500);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("supports manual start and refetch", async () => {
    const fetch = mockFetch(jsonResponse({ data: { value: 1 } }));
    const client = createClient({ endpoint: "/graphql", fetch });
    const watcher = client.watchQuery<{ value: number }>({
      query: "{ value }",
      intervalMs: 1_000,
      immediate: false,
    });
    watcher.stop();
    await expect(watcher.refetch()).resolves.toEqual({ value: 1 });
    watcher.start();
    expect(watcher.isRunning()).toBe(true);
    watcher.stop();
  });
});
