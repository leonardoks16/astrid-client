import type { RetryStrategy } from "../types/client";

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

export function retryDelay(attempt: number, baseMs: number, strategy: RetryStrategy): number {
  const multiplier = strategy === "exponential" ? 2 ** (attempt - 1) : attempt;
  const jitter = 0.8 + Math.random() * 0.4;
  return Math.round(baseMs * multiplier * jitter);
}
