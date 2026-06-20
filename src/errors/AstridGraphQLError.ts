import type { GraphQLErrorShape } from "../types/graphql";
import type { AstridGraphQLResponse } from "../types/response";
import { AstridError } from "./AstridError";

export interface AstridGraphQLErrorOptions<TData = unknown> extends ErrorOptions {
  errors: GraphQLErrorShape[];
  originalResponse: AstridGraphQLResponse<TData>;
  response: Response;
}

export class AstridGraphQLError<TData = unknown> extends AstridError {
  readonly errors: GraphQLErrorShape[];
  readonly locations?: GraphQLErrorShape["locations"];
  readonly path?: GraphQLErrorShape["path"];
  readonly extensions?: GraphQLErrorShape["extensions"];
  readonly data: TData | undefined;
  readonly originalResponse: AstridGraphQLResponse<TData>;
  readonly response: Response;
  readonly status: number;

  constructor(options: AstridGraphQLErrorOptions<TData>) {
    const first = options.errors[0];
    super(first?.message ?? "The GraphQL response contains errors.", {
      code: "ASTRID_GRAPHQL_ERROR",
      cause: options.cause,
    });
    this.name = "AstridGraphQLError";
    this.errors = options.errors;
    this.locations = first?.locations;
    this.path = first?.path;
    this.extensions = first?.extensions;
    this.data = options.originalResponse.data;
    this.originalResponse = options.originalResponse;
    this.response = options.response;
    this.status = options.response.status;
  }
}
