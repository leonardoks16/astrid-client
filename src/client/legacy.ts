import type { AstridGraphQLResponse } from "../types/response";
import type { GraphQLVariables } from "../types/graphql";
import type { AstridWatcher } from "../watch/types";
import { getLegacyClient } from "./legacyState";

export type LegacyQueryInput<TVariables extends object = GraphQLVariables> =
  | string
  | { query: string; variables?: TVariables };

export interface LegacyMutationInput<TVariables extends object = GraphQLVariables> {
  mutation: string;
  variables?: TVariables;
}

export async function astridQuery<TData = unknown, TVariables extends object = GraphQLVariables>(
  input: LegacyQueryInput<TVariables>,
): Promise<AstridGraphQLResponse<TData>> {
  const options = typeof input === "string" ? { query: input } : input;
  return getLegacyClient().query<TData, TVariables>({ ...options, errorPolicy: "all" });
}

export async function astridMutation<TData = unknown, TVariables extends object = GraphQLVariables>(
  input: LegacyMutationInput<TVariables>,
): Promise<AstridGraphQLResponse<TData>> {
  return getLegacyClient().mutation<TData, TVariables>({ ...input, errorPolicy: "all" });
}

export function astridWatchQuery<TData = unknown>(
  input: string | { query: string; variables?: GraphQLVariables; interval?: number },
  intervalOrCallback?: number | ((data: AstridGraphQLResponse<TData>) => void),
  callback?: (data: AstridGraphQLResponse<TData>) => void,
): AstridWatcher<AstridGraphQLResponse<TData>> {
  const normalized = typeof input === "string" ? { query: input } : input;
  const intervalMs =
    typeof intervalOrCallback === "number" ? intervalOrCallback : (normalized.interval ?? 5_000);
  const onData = typeof intervalOrCallback === "function" ? intervalOrCallback : callback;
  return getLegacyClient().watchQuery<TData, GraphQLVariables, "all">({
    query: normalized.query,
    ...(normalized.variables === undefined ? {} : { variables: normalized.variables }),
    intervalMs,
    errorPolicy: "all",
    ...(onData === undefined ? {} : { onData }),
  });
}
