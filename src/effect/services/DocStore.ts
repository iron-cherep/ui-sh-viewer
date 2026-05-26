import { Clock, Effect, Option } from "effect";
import { sortByNewest } from "../../lib/versions";
import { DocCacheError, type DocPage, type DocVersion, type VersionId, type VersionMeta } from "../domain";

const DB_NAME = "ui-sh-viewer-docs";
const DB_VERSION = 2;
/** Metadata for every stored version — small, so listing never loads the docs. */
const VERSIONS_STORE = "versions";
/** The heavy document graph for each version, keyed by the same version id. */
const PAGES_STORE = "docPages";
/** The v1 store the old single-version DocCache wrote (`id: "latest"`). */
const LEGACY_STORE = "docs";
const LEGACY_KEY = "latest";

type VersionRecord = VersionMeta;
type PagesRecord = { id: VersionId; docs: DocPage[] };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const tx = request.transaction!;
      if (!db.objectStoreNames.contains(VERSIONS_STORE)) {
        db.createObjectStore(VERSIONS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PAGES_STORE)) {
        db.createObjectStore(PAGES_STORE, { keyPath: "id" });
      }
      // One-time migration: fold the old `latest` record into its own version,
      // dated by its original `savedAt`, then drop the legacy store.
      if (event.oldVersion < 2 && db.objectStoreNames.contains(LEGACY_STORE)) {
        const legacy = tx.objectStore(LEGACY_STORE);
        const getLegacy = legacy.get(LEGACY_KEY);
        getLegacy.onsuccess = () => {
          const record = getLegacy.result as { savedAt?: string; docs?: DocPage[] } | undefined;
          if (record?.docs?.length) {
            const savedAt = Date.parse(record.savedAt ?? "") || Date.now();
            const id = String(savedAt);
            tx.objectStore(VERSIONS_STORE).put({ id, savedAt, docCount: record.docs.length });
            tx.objectStore(PAGES_STORE).put({ id, docs: record.docs } satisfies PagesRecord);
          }
          db.deleteObjectStore(LEGACY_STORE);
        };
      }
    };
    request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB"));
    request.onsuccess = () => resolve(request.result);
  });
}

async function withDb<A>(fn: (db: IDBDatabase) => Promise<A>): Promise<A> {
  const db = await openDb();
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

function idbList(): Promise<VersionMeta[]> {
  return withDb(
    (db) =>
      new Promise<VersionMeta[]>((resolve, reject) => {
        const request = db.transaction(VERSIONS_STORE, "readonly").objectStore(VERSIONS_STORE).getAll();
        request.onsuccess = () => resolve((request.result as VersionRecord[] | undefined) ?? []);
        request.onerror = () => reject(request.error ?? new Error("Unable to list versions"));
      }),
  );
}

function idbReadDocs(id: VersionId): Promise<DocPage[] | null> {
  return withDb(
    (db) =>
      new Promise<DocPage[] | null>((resolve, reject) => {
        const request = db.transaction(PAGES_STORE, "readonly").objectStore(PAGES_STORE).get(id);
        request.onerror = () => reject(request.error ?? new Error("Unable to read version"));
        request.onsuccess = () => resolve((request.result as PagesRecord | undefined)?.docs ?? null);
      }),
  );
}

function idbWrite(version: DocVersion): Promise<void> {
  return withDb(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction([VERSIONS_STORE, PAGES_STORE], "readwrite");
        tx.objectStore(VERSIONS_STORE).put({
          id: version.id,
          savedAt: version.savedAt,
          docCount: version.docCount,
        } satisfies VersionRecord);
        tx.objectStore(PAGES_STORE).put({ id: version.id, docs: version.docs } satisfies PagesRecord);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("Unable to write version"));
      }),
  );
}

function idbRemove(id: VersionId): Promise<void> {
  return withDb(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction([VERSIONS_STORE, PAGES_STORE], "readwrite");
        tx.objectStore(VERSIONS_STORE).delete(id);
        tx.objectStore(PAGES_STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("Unable to remove version"));
      }),
  );
}

/**
 * Persists the crawled documentation graph in IndexedDB as an append-only
 * history: every fetch becomes its own version keyed by the epoch-millis it was
 * stored at. The metadata of each version is kept in a small `versions` store so
 * the history can be listed without loading any document text. Read/write
 * failures are swallowed — they degrade to "no history" rather than blocking the
 * app, exactly as the old single-version cache did.
 */
export class DocStore extends Effect.Service<DocStore>()("app/DocStore", {
  effect: Effect.sync(() => {
    const list = Effect.tryPromise({
      try: () => idbList(),
      catch: (error) => new DocCacheError({ message: String(error) }),
    }).pipe(
      Effect.map(sortByNewest),
      Effect.orElseSucceed(() => [] as VersionMeta[]),
    );

    const read = (id: VersionId) =>
      Effect.tryPromise({
        try: () => idbReadDocs(id),
        catch: (error) => new DocCacheError({ message: String(error) }),
      }).pipe(
        Effect.map((docs) => (docs && docs.length ? Option.some(docs) : Option.none<DocPage[]>())),
        Effect.orElseSucceed(() => Option.none<DocPage[]>()),
      );

    const save = (docs: DocPage[]) =>
      Effect.gen(function* () {
        const now = yield* Clock.currentTimeMillis;
        // Strictly-increasing ids so rapid saves never collide and history stays
        // monotonically ordered even if the wall clock jitters backwards.
        const newest = (yield* list)[0]?.savedAt ?? 0;
        const savedAt = Math.max(now, newest + 1);
        const version: DocVersion = { id: String(savedAt), savedAt, docCount: docs.length, docs };
        yield* Effect.tryPromise({
          try: () => idbWrite(version),
          catch: (error) => new DocCacheError({ message: String(error) }),
        }).pipe(Effect.ignore);
        return version;
      });

    const remove = (id: VersionId) =>
      Effect.tryPromise({
        try: () => idbRemove(id),
        catch: (error) => new DocCacheError({ message: String(error) }),
      }).pipe(Effect.ignore);

    // Wiping is fire-and-forget — deleting the whole database needs no
    // transaction, promise, or error mapping.
    const clear = Effect.sync(() => {
      if ("indexedDB" in globalThis) indexedDB.deleteDatabase(DB_NAME);
    });

    return { list, read, save, remove, clear } as const;
  }),
}) {}
