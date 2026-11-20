import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, errorMessage, type ResearchJob } from "@/lib/api";

type ResourceState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

/**
 * Small dependency-free async resource hook. The loader receives an abort
 * signal; requests are cancelled when the component unmounts or deps change.
 */
export function useResource<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled ?? true;
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    loading: enabled,
  });
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const load = useCallback(
    async (signal: AbortSignal) => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const data = await loaderRef.current(signal);
        if (!signal.aborted) setState({ data, error: null, loading: false });
      } catch (error) {
        if (signal.aborted) return;
        setState((current) => ({
          ...current,
          error: errorMessage(error),
          loading: false,
        }));
      }
    },
    // `nonce` is the explicit reload trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nonce],
  );

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
    // The caller owns the dependency list; `load` carries the reload nonce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, enabled, ...deps]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  return { ...state, reload };
}

const ACTIVE_JOB_STATES = new Set(["pending", "running"]);

export function useJobPolling(jobId: string | null) {
  const [job, setJob] = useState<ResearchJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(jobId));

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    let timer = 0;
    let first = true;
    const controller = new AbortController();

    const poll = async () => {
      if (first) {
        first = false;
        setJob(null);
        setError(null);
        setLoading(true);
      }
      try {
        const next = await api.getJob(jobId, controller.signal);
        if (cancelled) return;
        setJob(next);
        setError(null);
        setLoading(false);
        if (ACTIVE_JOB_STATES.has(next.status)) {
          timer = window.setTimeout(poll, 2500);
        }
      } catch (pollError) {
        if (cancelled || controller.signal.aborted) return;
        setError(errorMessage(pollError));
        setLoading(false);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [jobId]);

  return { job, error, loading };
}

/** Track a started job id in session storage so a refresh does not lose it. */
export function useRememberedJob(projectId: string, kind: "research" | "stakeholders") {
  const key = `buildscope:job:${kind}:${projectId}`;
  const [version, setVersion] = useState(0);
  const jobId = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  }, [key, version]);

  const remember = useCallback(
    (next: string | null) => {
      if (next) window.sessionStorage.setItem(key, next);
      else window.sessionStorage.removeItem(key);
      setVersion((value) => value + 1);
    },
    [key],
  );

  return [jobId, remember] as const;
}
