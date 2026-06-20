import type { GraphQLErrorShape } from "./graphql";

export interface AstridGraphQLResponse<TData = unknown> {
  data?: TData;
  errors?: GraphQLErrorShape[];
  extensions?: Record<string, unknown>;
}

export type ErrorPolicy = "throw" | "all" | "ignore";
