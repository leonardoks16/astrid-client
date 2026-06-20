import { describe, expect, it } from "vitest";
import { astridMutation, astridQuery, createClient } from "../src";
import { jsonResponse, mockFetch } from "./helpers";

describe("legacy compatibility", () => {
  it("configures and queries through the legacy singleton", async () => {
    const fetch = mockFetch(jsonResponse({ data: { viewer: { id: "1" } } }));
    createClient({ base_url: "/graphql", fetch });
    await expect(astridQuery("{ viewer { id } }")).resolves.toEqual({
      data: { viewer: { id: "1" } },
    });
  });

  it("runs legacy mutations and preserves the response envelope", async () => {
    const fetch = mockFetch(jsonResponse({ data: { save: true } }));
    createClient({ base_url: "/graphql", fetch });
    await expect(astridMutation({ mutation: "mutation { save }" })).resolves.toEqual({
      data: { save: true },
    });
  });
});
