import { AstridError } from "./AstridError";

export class AstridTimeoutError extends AstridError {
  readonly timeoutMs: number;

  constructor(timeoutMs: number, options: ErrorOptions = {}) {
    super(`GraphQL request timed out after ${timeoutMs} ms.`, {
      code: "ASTRID_TIMEOUT_ERROR",
      cause: options.cause,
    });
    this.name = "AstridTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}
