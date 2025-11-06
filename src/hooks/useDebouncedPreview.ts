"use client";
import { useEffect, useState, useMemo } from "react";

export function useDebouncedPreview<TReq extends object, TRes = { html: string }>(
  url: string,
  body: TReq,
  delay = 400
) {
  const [data, setData] = useState<TRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Memoize serialized body to avoid dependency issues
  const bodyKey = useMemo(() => JSON.stringify(body), [body]);

  useEffect(() => {
    let stale = false;
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyKey,
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as TRes;
        if (!stale) setData(json);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Preview failed";
        if ((e as { name?: string })?.name !== "AbortError" && !stale) {
          setError(errorMessage);
        }
      } finally {
        if (!stale) setLoading(false);
      }
    }, delay);

    return () => { stale = true; ctrl.abort(); clearTimeout(id); };
  }, [url, bodyKey, delay]);

  return { data, error, loading };
}
