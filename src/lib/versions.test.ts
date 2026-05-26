import { describe, expect, it } from "vitest";
import type { VersionMeta } from "../effect/domain";
import {
  getVersionParam,
  latestOf,
  resolveVersion,
  setVersionParam,
  sortByNewest,
  VERSION_QUERY_PARAM,
} from "./versions";

const meta = (id: string, savedAt: number, docCount = 1): VersionMeta => ({ id, savedAt, docCount });

// Deliberately unsorted to prove the helpers don't assume input order.
const v1 = meta("100", 100, 10);
const v2 = meta("200", 200, 12);
const v3 = meta("300", 300, 14);
const unsorted: VersionMeta[] = [v2, v1, v3];

describe("sortByNewest", () => {
  it("orders versions newest-first without mutating the input", () => {
    const input = [...unsorted];
    expect(sortByNewest(input)).toEqual([v3, v2, v1]);
    expect(input).toEqual(unsorted);
  });

  it("breaks savedAt ties by descending id", () => {
    const a = meta("a", 500);
    const b = meta("b", 500);
    expect(sortByNewest([a, b])).toEqual([b, a]);
  });
});

describe("latestOf", () => {
  it("returns the newest version regardless of input order", () => {
    expect(latestOf(unsorted)).toEqual(v3);
  });

  it("returns null for an empty list", () => {
    expect(latestOf([])).toBeNull();
  });
});

describe("resolveVersion", () => {
  it("is Empty when nothing is stored", () => {
    expect(resolveVersion([], null)).toEqual({ _tag: "Empty" });
    expect(resolveVersion([], "200")).toEqual({ _tag: "Empty" });
  });

  it("resolves the latest when no version is pinned", () => {
    expect(resolveVersion(unsorted, null)).toEqual({ _tag: "Resolved", meta: v3, isLatest: true });
  });

  it("resolves a pinned version that exists", () => {
    expect(resolveVersion(unsorted, "100")).toEqual({ _tag: "Resolved", meta: v1, isLatest: false });
  });

  it("marks a pin equal to the newest version as latest", () => {
    expect(resolveVersion(unsorted, "300")).toEqual({ _tag: "Resolved", meta: v3, isLatest: true });
  });

  it("falls back to the latest when the pinned version is missing", () => {
    expect(resolveVersion(unsorted, "999")).toEqual({
      _tag: "Fallback",
      meta: v3,
      requestedId: "999",
    });
  });
});

describe("version query param", () => {
  it("reads a pinned id from the query string", () => {
    expect(getVersionParam(new URLSearchParams("?v=200"))).toBe("200");
  });

  it("treats a missing or blank param as following latest (null)", () => {
    expect(getVersionParam(new URLSearchParams(""))).toBeNull();
    expect(getVersionParam(new URLSearchParams("?v="))).toBeNull();
    expect(getVersionParam(new URLSearchParams("?v=   "))).toBeNull();
  });

  it("sets a pinned id while preserving other params, without mutating the input", () => {
    const input = new URLSearchParams("?foo=bar");
    const next = setVersionParam(input, "200");
    expect(next.get(VERSION_QUERY_PARAM)).toBe("200");
    expect(next.get("foo")).toBe("bar");
    expect(input.has(VERSION_QUERY_PARAM)).toBe(false);
  });

  it("removes the param when pinning to null (follow latest)", () => {
    const next = setVersionParam(new URLSearchParams("?v=200&foo=bar"), null);
    expect(next.has(VERSION_QUERY_PARAM)).toBe(false);
    expect(next.get("foo")).toBe("bar");
  });
});
