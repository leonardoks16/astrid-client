import type { AstridPolicyResult, AstridQueryOptions } from "../types/client";
import type { GraphQLVariables } from "../types/graphql";
import type { ErrorPolicy } from "../types/response";
import type { AstridWatcher, AstridWatchQueryOptions } from "./types";

class WatchQuery<TData, TVariables extends object, TErrorPolicy extends ErrorPolicy> {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private activeRequest: AbortController | undefined;
  private inFlight: Promise<AstridPolicyResult<TData, TErrorPolicy>> | undefined;
  private running = false;

  constructor(
    private readonly execute: (
      options: AstridQueryOptions<TVariables>,
    ) => Promise<AstridPolicyResult<TData, TErrorPolicy>>,
    private readonly options: AstridWatchQueryOptions<TData, TVariables, TErrorPolicy>,
  ) {
    const interval = options.intervalMs ?? 5_000;
    if (!Number.isFinite(interval) || interval <= 0) {
      throw new TypeError("watchQuery intervalMs must be a positive number.");
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    if (this.options.immediate ?? true) void this.poll(true).catch(() => undefined);
    else this.schedule();
  }

  stop(): void {
    this.running = false;
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    this.activeRequest?.abort("watchQuery stopped");
  }

  isRunning(): boolean {
    return this.running;
  }

  refetch(): Promise<AstridPolicyResult<TData, TErrorPolicy>> {
    return this.poll(false);
  }

  private schedule(): void {
    if (!this.running) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.poll(true).catch(() => undefined);
    }, this.options.intervalMs ?? 5_000);
  }

  private poll(scheduleNext: boolean): Promise<AstridPolicyResult<TData, TErrorPolicy>> {
    if (this.inFlight) return this.inFlight;

    const {
      intervalMs: _interval,
      immediate: _immediate,
      onData,
      onError,
      signal,
      ...query
    } = this.options;
    void _interval;
    void _immediate;
    this.activeRequest = new AbortController();

    const relayAbort = (): void => this.activeRequest?.abort(signal?.reason);
    if (signal?.aborted) relayAbort();
    else signal?.addEventListener("abort", relayAbort, { once: true });

    this.inFlight = this.execute({ ...query, signal: this.activeRequest.signal })
      .then(async (data) => {
        await onData?.(data);
        return data;
      })
      .catch(async (error: unknown) => {
        if (this.running || !this.activeRequest?.signal.aborted) await onError?.(error);
        throw error;
      })
      .finally(() => {
        signal?.removeEventListener("abort", relayAbort);
        this.inFlight = undefined;
        this.activeRequest = undefined;
        if (scheduleNext) this.schedule();
      });

    return this.inFlight;
  }
}

export function createWatcher<
  TData = unknown,
  TVariables extends object = GraphQLVariables,
  TErrorPolicy extends ErrorPolicy = "throw",
>(
  execute: (
    options: AstridQueryOptions<TVariables>,
  ) => Promise<AstridPolicyResult<TData, TErrorPolicy>>,
  options: AstridWatchQueryOptions<TData, TVariables, TErrorPolicy>,
): AstridWatcher<AstridPolicyResult<TData, TErrorPolicy>> {
  const watch = new WatchQuery(execute, options);
  const unsubscribe = (() => watch.stop()) as AstridWatcher<
    AstridPolicyResult<TData, TErrorPolicy>
  >;
  unsubscribe.start = watch.start.bind(watch);
  unsubscribe.stop = watch.stop.bind(watch);
  unsubscribe.refetch = watch.refetch.bind(watch);
  unsubscribe.isRunning = watch.isRunning.bind(watch);
  watch.start();
  return unsubscribe;
}
