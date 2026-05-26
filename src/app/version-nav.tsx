import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams, type NavigateOptions, type To } from "react-router-dom";
import { type VersionId } from "../effect/domain";
import { getVersionParam, setVersionParam } from "../lib/versions";
import { useDocs } from "./DocsProvider";

/**
 * Navigation that carries the pinned version (`?v=`) forward. Every in-app link
 * must go through `to`/`go` so browsing between docs never silently unpins the
 * version the user selected.
 */
export function useVersionedNav() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const pin = getVersionParam(params);

  const to = useCallback(
    (pathname: string): To => {
      if (pin === null) return { pathname };
      return { pathname, search: `?${setVersionParam(new URLSearchParams(), pin)}` };
    },
    [pin],
  );

  const go = useCallback(
    (pathname: string, options?: NavigateOptions) => navigate(to(pathname), options),
    [navigate, to],
  );

  /** Pin (or, with null, unpin → follow latest) without changing the path. */
  const pinVersion = useCallback(
    (id: VersionId | null, options?: NavigateOptions) =>
      navigate({ search: `?${setVersionParam(params, id)}` }, options),
    [navigate, params],
  );

  return { to, go, pin, pinVersion };
}

/**
 * Mounted inside the router: keeps the displayed version in sync with the `?v=`
 * query param. The URL is the source of truth — changing the param (by the user,
 * or by `pinVersion`) loads that version; a missing pin falls back to the latest.
 */
export function VersionUrlSync() {
  const [params] = useSearchParams();
  const { hydrated, showVersion } = useDocs();
  const requested = getVersionParam(params);

  useEffect(() => {
    if (!hydrated) return;
    void showVersion(requested);
  }, [hydrated, requested, showVersion]);

  return null;
}
