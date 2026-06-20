import type { AstridGraphQLClient } from "./AstridGraphQLClient";
import type { ErrorPolicy } from "../types/response";

let legacyClient: AstridGraphQLClient<ErrorPolicy> | undefined;

export function setLegacyClient(client: AstridGraphQLClient<ErrorPolicy>): void {
  legacyClient = client;
}

export function getLegacyClient(): AstridGraphQLClient<ErrorPolicy> {
  if (!legacyClient) {
    throw new Error(
      "The legacy Astrid client is not configured. Call createClient({ base_url: endpoint }) first, or use the instance API.",
    );
  }
  return legacyClient;
}
