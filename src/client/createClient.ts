import type { AstridClientOptions } from "../types/client";
import type { ErrorPolicy } from "../types/response";
import { AstridGraphQLClient } from "./AstridGraphQLClient";
import { setLegacyClient } from "./legacyState";

export interface LegacyClientOptions<TErrorPolicy extends ErrorPolicy = ErrorPolicy> extends Omit<
  AstridClientOptions<TErrorPolicy>,
  "endpoint"
> {
  endpoint?: string;
  base_url?: string;
  /** Retained for source compatibility. Prefer top-level client options. */
  options?: Record<string, unknown>;
}

export function createClient<TErrorPolicy extends ErrorPolicy = "throw">(
  options: AstridClientOptions<TErrorPolicy> | LegacyClientOptions<TErrorPolicy>,
): AstridGraphQLClient<TErrorPolicy> {
  const endpoint = options.endpoint ?? ("base_url" in options ? options.base_url : undefined);
  const clientOptions: LegacyClientOptions<TErrorPolicy> = { ...options };
  delete clientOptions.base_url;
  delete clientOptions.options;
  const client = new AstridGraphQLClient({
    ...clientOptions,
    endpoint: endpoint ?? "",
  });

  if ("base_url" in options) setLegacyClient(client);
  return client;
}
