import { Effect, Option } from "effect";
import { DocCacheError, type DocPage } from "../domain";

const DB_NAME = "ui-sh-viewer-docs";
const STORE = "docs";
const KEY = "latest";

type CacheRecord = {
  id: typeof KEY;
  savedAt: string;
  docs: DocPage[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB"));
    request.onsuccess = () => resolve(request.result);
  });
}

async function idbGet(): Promise<CacheRecord | null> {
  const db = await openDb();
  try {
    return await new Promise<CacheRecord | null>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readonly");
      const request = transaction.objectStore(STORE).get(KEY);
      request.onerror = () => reject(request.error ?? new Error("Unable to read docs cache"));
      request.onsuccess = () => resolve((request.result as CacheRecord | undefined) ?? null);
    });
  } finally {
    db.close();
  }
}

async function idbPut(record: CacheRecord): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Unable to write docs cache"));
    });
  } finally {
    db.close();
  }
}

/**
 * Persists the crawled documentation graph in IndexedDB so the app can hydrate
 * instantly on the next launch. Cache failures are swallowed — they never block
 * the app, they just mean a fresh fetch is needed.
 */
export class DocCache extends Effect.Service<DocCache>()("app/DocCache", {
  effect: Effect.sync(() => {
    const read = Effect.tryPromise({
      try: () => idbGet(),
      catch: (error) => new DocCacheError({ message: String(error) }),
    }).pipe(
      Effect.map((record) =>
        record && record.docs.length ? Option.some(record.docs) : Option.none<DocPage[]>(),
      ),
      Effect.orElseSucceed(() => Option.none<DocPage[]>()),
    );

    const write = (docs: DocPage[]) =>
      Effect.tryPromise({
        try: () => idbPut({ id: KEY, savedAt: new Date().toISOString(), docs }),
        catch: (error) => new DocCacheError({ message: String(error) }),
      }).pipe(Effect.ignore);

    // Wiping is fire-and-forget — deleting the whole database needs no
    // transaction, promise, or error mapping.
    const clear = Effect.sync(() => {
      if ("indexedDB" in globalThis) indexedDB.deleteDatabase(DB_NAME);
    });

    return { read, write, clear } as const;
  }),
}) {}
