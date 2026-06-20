import type { HeaderProvider } from "../types/client";

export async function resolveHeaders(
  provider: HeaderProvider | undefined,
  assigned: Headers,
  removed: ReadonlySet<string>,
  requestHeaders?: HeadersInit,
): Promise<Headers> {
  const source = typeof provider === "function" ? await provider() : provider;
  const headers = new Headers(source);

  for (const name of removed) headers.delete(name);
  assigned.forEach((value, name) => headers.set(name, value));
  new Headers(requestHeaders).forEach((value, name) => headers.set(name, value));

  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  if (!headers.has("accept"))
    headers.set("accept", "application/graphql-response+json, application/json");
  return headers;
}
