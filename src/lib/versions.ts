import type { VersionId, VersionMeta } from "../effect/domain";

/** Query parameter that pins the viewer to a specific stored version. */
export const VERSION_QUERY_PARAM = "v";

/** Newest-first ordering (by `savedAt`, ties broken by descending id). Pure. */
export function sortByNewest<T extends VersionMeta>(metas: ReadonlyArray<T>): T[] {
  return [...metas].sort((a, b) => b.savedAt - a.savedAt || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
}

/** The most recently saved version, or null when nothing is stored. */
export function latestOf<T extends VersionMeta>(metas: ReadonlyArray<T>): T | null {
  return sortByNewest(metas)[0] ?? null;
}

/**
 * What the viewer should display given the stored versions and the id pinned in
 * the URL (`null` = follow latest):
 *  - `Empty`    — nothing stored yet.
 *  - `Resolved` — showing `meta`; `isLatest` is true when it is the newest one.
 *  - `Fallback` — the pinned `requestedId` is gone, so we show the latest instead
 *                 (the UI surfaces this as a recoverable error).
 */
export type VersionResolution =
  | { readonly _tag: "Empty" }
  | { readonly _tag: "Resolved"; readonly meta: VersionMeta; readonly isLatest: boolean }
  | { readonly _tag: "Fallback"; readonly meta: VersionMeta; readonly requestedId: VersionId };

export function resolveVersion(
  metas: ReadonlyArray<VersionMeta>,
  requestedId: VersionId | null,
): VersionResolution {
  const latest = latestOf(metas);
  if (!latest) {
    return { _tag: "Empty" };
  }
  if (requestedId === null) {
    return { _tag: "Resolved", meta: latest, isLatest: true };
  }
  const pinned = metas.find((meta) => meta.id === requestedId);
  if (!pinned) {
    return { _tag: "Fallback", meta: latest, requestedId };
  }
  return { _tag: "Resolved", meta: pinned, isLatest: pinned.id === latest.id };
}

/** The pinned version id in the query string, or null when following latest. */
export function getVersionParam(params: URLSearchParams): VersionId | null {
  const raw = params.get(VERSION_QUERY_PARAM)?.trim();
  return raw ? raw : null;
}

/** A copy of `params` with the version pin set (or removed when `id` is null). */
export function setVersionParam(params: URLSearchParams, id: VersionId | null): URLSearchParams {
  const next = new URLSearchParams(params);
  if (id === null) {
    next.delete(VERSION_QUERY_PARAM);
  } else {
    next.set(VERSION_QUERY_PARAM, id);
  }
  return next;
}
