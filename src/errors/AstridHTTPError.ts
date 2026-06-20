import { AstridError } from "./AstridError";

export interface AstridHTTPErrorOptions extends ErrorOptions {
  response: Response;
  body?: unknown;
}

export class AstridHTTPError extends AstridError {
  readonly status: number;
  readonly statusText: string;
  readonly response: Response;
  readonly body?: unknown;

  constructor(options: AstridHTTPErrorOptions) {
    const detail = options.response.statusText ? ` ${options.response.statusText}` : "";
    super(`GraphQL request failed with HTTP ${options.response.status}${detail}.`, {
      code: "ASTRID_HTTP_ERROR",
      cause: options.cause,
    });
    this.name = "AstridHTTPError";
    this.status = options.response.status;
    this.statusText = options.response.statusText;
    this.response = options.response;
    this.body = options.body;
  }
}
