import { Effect, Option } from "effect";
import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it } from "vitest";
import type { DocPage, VersionId } from "../domain";
import { DocStore } from "./DocStore";

// A clean in-memory IndexedDB per test so versions never leak between cases.
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const run = <A>(effect: Effect.Effect<A, never, DocStore>): Promise<A> =>
  Effect.runPromise(effect.pipe(Effect.provide(DocStore.Default)));

const page = (uri: string): DocPage => ({
  uri,
  title: uri,
  text: `# ${uri}`,
  links: [],
});

const docsA = [page("uidotsh://ui"), page("uidotsh://ui/a")];
const docsB = [page("uidotsh://ui"), page("uidotsh://ui/b"), page("uidotsh://ui/c")];

describe("DocStore", () => {
  it("starts empty", async () => {
    const metas = await run(Effect.gen(function* () {
      return yield* (yield* DocStore).list;
    }));
    expect(metas).toEqual([]);
  });

  it("saves a version and reads it back with metadata", async () => {
    const result = await run(Effect.gen(function* () {
      const store = yield* DocStore;
      const saved = yield* store.save(docsA);
      const metas = yield* store.list;
      const read = yield* store.read(saved.id);
      return { saved, metas, read };
    }));

    expect(result.saved.docCount).toBe(2);
    expect(result.saved.id).toBe(String(result.saved.savedAt));
    expect(result.metas).toEqual([
      { id: result.saved.id, savedAt: result.saved.savedAt, docCount: 2 },
    ]);
    expect(Option.getOrNull(result.read)).toEqual(docsA);
  });

  it("keeps every saved version, newest first, with distinct ids", async () => {
    const { metas, ids } = await run(Effect.gen(function* () {
      const store = yield* DocStore;
      const first = yield* store.save(docsA);
      const second = yield* store.save(docsB);
      const metas = yield* store.list;
      return { metas, ids: [first.id, second.id] };
    }));

    expect(new Set(ids).size).toBe(2);
    expect(metas.map((m) => m.docCount)).toEqual([3, 2]); // newest (docsB) first
    expect(metas[0].savedAt).toBeGreaterThan(metas[1].savedAt);
  });

  it("removes a single version, leaving the others intact", async () => {
    const remaining = await run(Effect.gen(function* () {
      const store = yield* DocStore;
      const first = yield* store.save(docsA);
      yield* store.save(docsB);
      yield* store.remove(first.id);
      const metas = yield* store.list;
      const goneDocs = yield* store.read(first.id);
      return { metas, goneDocs };
    }));

    expect(remaining.metas).toHaveLength(1);
    expect(remaining.metas[0].docCount).toBe(3);
    expect(Option.isNone(remaining.goneDocs)).toBe(true);
  });

  it("returns None when reading an unknown version", async () => {
    const read = await run(Effect.gen(function* () {
      return yield* (yield* DocStore).read("does-not-exist" as VersionId);
    }));
    expect(Option.isNone(read)).toBe(true);
  });

  it("clear wipes all versions", async () => {
    const metas = await run(Effect.gen(function* () {
      const store = yield* DocStore;
      yield* store.save(docsA);
      yield* store.save(docsB);
      yield* store.clear;
      return yield* store.list;
    }));
    expect(metas).toEqual([]);
  });

  it("migrates a legacy single-`latest` record into a version", async () => {
    // Recreate the v1 schema the old DocCache wrote.
    const legacySavedAt = "2026-05-20T18:30:00.000Z";
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("ui-sh-viewer-docs", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("docs", { keyPath: "id" });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("docs", "readwrite");
        tx.objectStore("docs").put({ id: "latest", savedAt: legacySavedAt, docs: docsB });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });

    const { metas, docs } = await run(Effect.gen(function* () {
      const store = yield* DocStore;
      const metas = yield* store.list;
      const docs = yield* store.read(metas[0]!.id);
      return { metas, docs };
    }));

    expect(metas).toHaveLength(1);
    expect(metas[0].savedAt).toBe(Date.parse(legacySavedAt));
    expect(metas[0].docCount).toBe(3);
    expect(Option.getOrNull(docs)).toEqual(docsB);
  });
});
