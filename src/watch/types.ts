import type { AstridPolicyResult, AstridQueryOptions } from "../types/client";
import type { GraphQLVariables } from "../types/graphql";
import type { ErrorPolicy } from "../types/response";

export type AstridWatchQueryOptions<
  TData = unknown,
  TVariables extends object = GraphQLVariables,
  TErrorPolicy extends ErrorPolicy = "throw",
> = Omit<AstridQueryOptions<TVariables>, "errorPolicy"> & {
  errorPolicy?: TErrorPolicy;
  intervalMs?: number;
  immediate?: boolean;
  onData?: (data: AstridPolicyResult<TData, TErrorPolicy>) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
};

export interface AstridWatcher<TData = unknown> {
  (): void;
  start(): void;
  stop(): void;
  refetch(): Promise<TData>;
  isRunning(): boolean;
}
