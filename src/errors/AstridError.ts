export interface AstridErrorOptions extends ErrorOptions {
  code?: string;
}

export class AstridError extends Error {
  readonly code: string;

  constructor(message: string, options: AstridErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "AstridError";
    this.code = options.code ?? "ASTRID_ERROR";
  }
}
