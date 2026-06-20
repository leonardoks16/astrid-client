export interface RequestSignal {
  signal: AbortSignal;
  didTimeout: () => boolean;
  cleanup: () => void;
}

export function createRequestSignal(
  external: AbortSignal | undefined,
  timeoutMs: number,
): RequestSignal {
  const controller = new AbortController();
  let timedOut = false;

  const abortFromExternal = (): void => controller.abort(external?.reason);
  if (external?.aborted) abortFromExternal();
  else external?.addEventListener("abort", abortFromExternal, { once: true });

  const timeout =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs)
      : undefined;

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      if (timeout !== undefined) clearTimeout(timeout);
      external?.removeEventListener("abort", abortFromExternal);
    },
  };
}
