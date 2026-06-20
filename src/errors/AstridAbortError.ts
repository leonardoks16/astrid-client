import { AstridError } from "./AstridError";

export class AstridAbortError extends AstridError {
  readonly reason?: unknown;

  constructor(reason?: unknown, options: ErrorOptions = {}) {
    super("The GraphQL request was aborted.", {
      code: "ASTRID_ABORT_ERROR",
      cause: options.cause,
    });
    this.name = "AstridAbortError";
    this.reason = reason;
  }
}
