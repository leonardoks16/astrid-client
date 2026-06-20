import { AstridError } from "./AstridError";

export class AstridNetworkError extends AstridError {
  constructor(
    message = "The GraphQL request failed because of a network error.",
    options: ErrorOptions = {},
  ) {
    super(message, { code: "ASTRID_NETWORK_ERROR", cause: options.cause });
    this.name = "AstridNetworkError";
  }
}
