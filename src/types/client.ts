import type { GraphQLVariables, PersistedQueryOptions } from "./graphql";
import type { AstridGraphQLResponse, ErrorPolicy } from "./response";

export type AstridFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type HeaderProvider = HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
export type RetryStrategy = "linear" | "exponential";
export type OperationType = "query" | "mutation" | "request";

export interface AstridRequestContext<TVariables extends object = GraphQLVariables> {
  endpoint: string;
  document: string;
  variables?: TVariables;
  operationName?: string;
  operationType: OperationType;
  attempt: number;
  init: RequestInit;
}

export interface AstridResponseContext<
  TVariables extends object = GraphQLVariables,
> extends AstridRequestContext<TVariables> {
  response: Response;
}

export interface AstridClientOptions<TErrorPolicy extends ErrorPolicy = ErrorPolicy> {
  endpoint: string;
  headers?: HeaderProvider;
  fetch?: AstridFetch;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  retryStrategy?: RetryStrategy;
  retryMutations?: boolean;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  cache?: RequestCache;
  errorPolicy?: TErrorPolicy;
  onRequest?: (request: AstridRequestContext<object>) => void | Promise<void>;
  onResponse?: (response: AstridResponseContext<object>) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
}

export interface AstridRequestOptions<TVariables extends object = GraphQLVariables> {
  document: string;
  variables?: TVariables;
  operationName?: string;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  retryStrategy?: RetryStrategy;
  errorPolicy?: ErrorPolicy;
  persistedQuery?: PersistedQueryOptions;
}

export interface AstridQueryOptions<TVariables extends object = GraphQLVariables> extends Omit<
  AstridRequestOptions<TVariables>,
  "document"
> {
  query: string;
}

export interface AstridMutationOptions<TVariables extends object = GraphQLVariables> extends Omit<
  AstridRequestOptions<TVariables>,
  "document"
> {
  mutation: string;
}

export type AstridRequestResult<TData> = TData | AstridGraphQLResponse<TData>;
export type AstridPolicyResult<TData, TPolicy extends ErrorPolicy> = TPolicy extends "all"
  ? AstridGraphQLResponse<TData>
  : TData;
