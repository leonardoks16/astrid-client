import { isRetryableStatus, retryDelay } from "../core/retry";
import { resolveHeaders } from "../core/headers";
import { createRequestSignal } from "../core/timeout";
import {
  AstridAbortError,
  AstridError,
  AstridGraphQLError,
  AstridHTTPError,
  AstridNetworkError,
  AstridTimeoutError,
} from "../errors";
import type {
  AstridClientOptions,
  AstridMutationOptions,
  AstridPolicyResult,
  AstridQueryOptions,
  AstridRequestContext,
  AstridRequestOptions,
  AstridRequestResult,
  AstridResponseContext,
  OperationType,
} from "../types/client";
import type { GraphQLVariables } from "../types/graphql";
import type { AstridGraphQLResponse, ErrorPolicy } from "../types/response";
import { sleep } from "../utils/sleep";
import { createWatcher } from "../watch/WatchQuery";
import type { AstridWatcher, AstridWatchQueryOptions } from "../watch/types";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRY_DELAY_MS = 300;

interface ExecuteOptions<TVariables extends object> extends AstridRequestOptions<TVariables> {
  operationType: OperationType;
}

export class AstridGraphQLClient<TDefaultErrorPolicy extends ErrorPolicy = "throw"> {
  readonly endpoint: string;
  private readonly options: AstridClientOptions<TDefaultErrorPolicy>;
  private readonly fetchImplementation: NonNullable<AstridClientOptions["fetch"]>;
  private readonly assignedHeaders = new Headers();
  private readonly removedHeaders = new Set<string>();

  constructor(options: AstridClientOptions<TDefaultErrorPolicy>) {
    if (!options || typeof options.endpoint !== "string" || options.endpoint.trim() === "") {
      throw new TypeError("AstridGraphQLClient requires a non-empty endpoint.");
    }
    validateNonNegative("timeoutMs", options.timeoutMs);
    validateNonNegativeInteger("retries", options.retries);
    validateNonNegative("retryDelayMs", options.retryDelayMs);

    const runtimeFetch = globalThis.fetch?.bind(globalThis);
    const fetchImplementation = options.fetch ?? runtimeFetch;
    if (!fetchImplementation) {
      throw new AstridError(
        "No global fetch implementation is available. Pass a fetch function in the client options.",
        { code: "ASTRID_FETCH_UNAVAILABLE" },
      );
    }

    this.endpoint = options.endpoint;
    this.options = options;
    this.fetchImplementation = fetchImplementation;
  }

  setHeader(name: string, value: string): this {
    this.assignedHeaders.set(name, value);
    this.removedHeaders.delete(name.toLowerCase());
    return this;
  }

  setHeaders(headers: HeadersInit): this {
    new Headers(headers).forEach((value, name) => this.setHeader(name, value));
    return this;
  }

  removeHeader(name: string): this {
    this.assignedHeaders.delete(name);
    this.removedHeaders.add(name.toLowerCase());
    return this;
  }

  request<TData = unknown, TVariables extends object = GraphQLVariables>(
    options: AstridRequestOptions<TVariables> & { errorPolicy: "all" },
  ): Promise<AstridGraphQLResponse<TData>>;
  request<TData = unknown, TVariables extends object = GraphQLVariables>(
    options: AstridRequestOptions<TVariables>,
  ): Promise<AstridPolicyResult<TData, TDefaultErrorPolicy>>;
  request<TData = unknown, TVariables extends object = GraphQLVariables>(
    options: AstridRequestOptions<TVariables>,
  ): Promise<AstridRequestResult<TData>> {
    return this.execute<TData, TVariables>({ ...options, operationType: "request" });
  }

  query<TData = unknown, TVariables extends object = GraphQLVariables>(
    options: AstridQueryOptions<TVariables> & { errorPolicy: "all" },
  ): Promise<AstridGraphQLResponse<TData>>;
  query<TData = unknown, TVariables extends object = GraphQLVariables>(
    options: AstridQueryOptions<TVariables>,
  ): Promise<AstridPolicyResult<TData, TDefaultErrorPolicy>>;
  query<TData = unknown, TVariables extends object = GraphQLVariables>(
    options: AstridQueryOptions<TVariables>,
  ): Promise<AstridRequestResult<TData>> {
    return this.execute<TData, TVariables>({
      ...options,
      document: options.query,
      operationType: "query",
    });
  }

  mutation<TData = unknown, TVariables extends object = GraphQLVariables>(
    options: AstridMutationOptions<TVariables> & { errorPolicy: "all" },
  ): Promise<AstridGraphQLResponse<TData>>;
  mutation<TData = unknown, TVariables extends object = GraphQLVariables>(
    options: AstridMutationOptions<TVariables>,
  ): Promise<AstridPolicyResult<TData, TDefaultErrorPolicy>>;
  mutation<TData = unknown, TVariables extends object = GraphQLVariables>(
    options: AstridMutationOptions<TVariables>,
  ): Promise<AstridRequestResult<TData>> {
    return this.execute<TData, TVariables>({
      ...options,
      document: options.mutation,
      operationType: "mutation",
    });
  }

  watchQuery<
    TData = unknown,
    TVariables extends object = GraphQLVariables,
    TErrorPolicy extends ErrorPolicy = TDefaultErrorPolicy,
  >(
    options: AstridWatchQueryOptions<TData, TVariables, TErrorPolicy>,
  ): AstridWatcher<AstridPolicyResult<TData, TErrorPolicy>> {
    return createWatcher(
      (queryOptions) =>
        this.query<TData, TVariables>(queryOptions) as unknown as Promise<
          AstridPolicyResult<TData, TErrorPolicy>
        >,
      options,
    );
  }

  private async execute<TData, TVariables extends object>(
    options: ExecuteOptions<TVariables>,
  ): Promise<AstridRequestResult<TData>> {
    try {
      return await this.executeWithRetries<TData, TVariables>(options);
    } catch (error) {
      try {
        await this.options.onError?.(error);
      } catch {
        // An error hook must not hide the request failure.
      }
      throw error;
    }
  }

  private async executeWithRetries<TData, TVariables extends object>(
    options: ExecuteOptions<TVariables>,
  ): Promise<AstridRequestResult<TData>> {
    if (typeof options.document !== "string" || options.document.trim() === "") {
      throw new TypeError("A non-empty GraphQL document is required.");
    }
    validateNonNegative("timeoutMs", options.timeoutMs);
    validateNonNegativeInteger("retries", options.retries);
    validateNonNegative("retryDelayMs", options.retryDelayMs);

    const timeoutMs = options.timeoutMs ?? this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const configuredRetries = options.retries ?? this.options.retries ?? 0;
    const retries =
      options.operationType === "mutation" &&
      options.retries === undefined &&
      !this.options.retryMutations
        ? 0
        : configuredRetries;
    const baseDelay = options.retryDelayMs ?? this.options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    const strategy = options.retryStrategy ?? this.options.retryStrategy ?? "exponential";

    for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
      const headers = await resolveHeaders(
        this.options.headers,
        this.assignedHeaders,
        this.removedHeaders,
        options.headers,
      );
      const body = JSON.stringify({
        query: options.document,
        ...(options.variables === undefined ? {} : { variables: options.variables }),
        ...(options.operationName === undefined ? {} : { operationName: options.operationName }),
        ...(options.persistedQuery
          ? { extensions: { persistedQuery: { version: 1, ...options.persistedQuery } } }
          : {}),
      });
      const requestSignal = createRequestSignal(options.signal, timeoutMs);
      const init: RequestInit = {
        method: "POST",
        headers,
        body,
        signal: requestSignal.signal,
        ...(this.options.credentials === undefined
          ? {}
          : { credentials: this.options.credentials }),
        ...(this.options.mode === undefined ? {} : { mode: this.options.mode }),
        ...(this.options.cache === undefined ? {} : { cache: this.options.cache }),
      };
      const context: AstridRequestContext<TVariables> = {
        endpoint: this.endpoint,
        document: options.document,
        ...(options.variables === undefined ? {} : { variables: options.variables }),
        ...(options.operationName === undefined ? {} : { operationName: options.operationName }),
        operationType: options.operationType,
        attempt,
        init,
      };

      try {
        if (requestSignal.signal.aborted) {
          throw classifyFetchError(
            undefined,
            requestSignal.didTimeout(),
            options.signal,
            timeoutMs,
          );
        }
        await this.options.onRequest?.(context);
        let response: Response;
        try {
          response = await this.fetchImplementation(this.endpoint, init);
        } catch (cause) {
          const error = classifyFetchError(
            cause,
            requestSignal.didTimeout(),
            options.signal,
            timeoutMs,
          );
          if (attempt <= retries && isTransientError(error)) {
            await sleep(retryDelay(attempt, baseDelay, strategy));
            continue;
          }
          throw error;
        }

        const responseContext: AstridResponseContext<TVariables> = {
          ...context,
          response: response.clone(),
        };
        await this.options.onResponse?.(responseContext);

        if (!response.ok) {
          if (attempt <= retries && isRetryableStatus(response.status)) {
            await sleep(retryDelay(attempt, baseDelay, strategy));
            continue;
          }
          throw new AstridHTTPError({ response, body: await readBody(response) });
        }

        const payload = await readGraphQLResponse<TData>(response);
        const policy = options.errorPolicy ?? this.options.errorPolicy ?? "throw";
        if (payload.errors?.length) {
          if (policy === "throw") {
            throw new AstridGraphQLError({
              errors: payload.errors,
              originalResponse: payload,
              response,
            });
          }
          if (policy === "all") return payload;
        }
        return policy === "all" ? payload : (payload.data as TData);
      } finally {
        requestSignal.cleanup();
      }
    }

    throw new AstridError("GraphQL request exhausted its retry attempts.");
  }
}

function validateNonNegative(name: string, value: number | undefined): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    throw new TypeError(`${name} must be a non-negative number.`);
  }
}

function validateNonNegativeInteger(name: string, value: number | undefined): void {
  validateNonNegative(name, value);
  if (value !== undefined && !Number.isInteger(value)) {
    throw new TypeError(`${name} must be an integer.`);
  }
}

function classifyFetchError(
  cause: unknown,
  timedOut: boolean,
  externalSignal: AbortSignal | undefined,
  timeoutMs: number,
): AstridError {
  if (timedOut) return new AstridTimeoutError(timeoutMs, { cause });
  if (externalSignal?.aborted) {
    return new AstridAbortError(externalSignal.reason, { cause });
  }
  if (cause instanceof Error && cause.name === "AbortError") {
    return new AstridAbortError(undefined, { cause });
  }
  return new AstridNetworkError(undefined, { cause });
}

function isTransientError(error: AstridError): boolean {
  return error instanceof AstridNetworkError || error instanceof AstridTimeoutError;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function readGraphQLResponse<TData>(
  response: Response,
): Promise<AstridGraphQLResponse<TData>> {
  const body = await readBody(response);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AstridNetworkError("The GraphQL endpoint returned an invalid JSON response.");
  }
  return body;
}
