import { listen } from "@tauri-apps/api/event";
import { Effect, Option } from "effect";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type DocPage, type DocVersion, type VersionId, type VersionMeta } from "../effect/domain";
import { DocCrawler, type CrawlProgress } from "../effect/services/DocCrawler";
import { DocStore } from "../effect/services/DocStore";
import { McpClient } from "../effect/services/McpClient";
import { TokenStore } from "../effect/services/TokenStore";
import { toDocPage } from "../lib/docs";
import { isTauri } from "../lib/platform";
import { latestOf, resolveVersion } from "../lib/versions";
import { runtime } from "./runtime";

const TOKEN_REJECTED = "That access token was rejected. Double-check it and try again.";
const VERSION_MISSING =
  "That version isn’t stored on this device — showing the latest one instead.";

export type DocsStatus = "idle" | "connecting" | "ready" | "refreshing" | "error";

type DocsContextValue = {
  /** True once the initial token + version history read has finished. */
  hydrated: boolean;
  hasToken: boolean;
  docs: Map<string, DocPage>;
  docList: DocPage[];
  status: DocsStatus;
  progress: CrawlProgress | null;
  /** Fatal connect/fetch error (token rejected, transport). */
  error: string | null;
  /** Recoverable notice, e.g. a pinned version that no longer exists. */
  versionNotice: string | null;
  /** Stored versions, newest first. */
  versions: VersionMeta[];
  /** The version whose docs are currently displayed, if any. */
  currentVersion: VersionMeta | null;
  /** Save the token and fetch the first version. Resolves true on success. */
  connect: (token: string) => Promise<boolean>;
  /** Fetch the latest docs into a new version and display it. */
  reload: () => Promise<void>;
  /** Display the version pinned in the URL (null = follow latest). */
  showVersion: (requestedId: VersionId | null) => Promise<void>;
  /** Delete a stored version. */
  removeVersion: (id: VersionId) => Promise<void>;
  /** Fetch a single doc into the live view if it isn't already loaded. */
  ensureDoc: (uri: string) => Promise<void>;
  /** Forget the token and every stored version. */
  signOut: () => void;
};

const DocsContext = createContext<DocsContextValue | null>(null);

const readVersionDocs = (id: VersionId) =>
  Effect.gen(function* () {
    const store = yield* DocStore;
    return yield* store.read(id);
  });

const metaOf = (version: DocVersion): VersionMeta => ({
  id: version.id,
  savedAt: version.savedAt,
  docCount: version.docCount,
});

export function DocsProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [docs, setDocs] = useState<Map<string, DocPage>>(() => new Map());
  const [status, setStatus] = useState<DocsStatus>("idle");
  const [progress, setProgress] = useState<CrawlProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [versionNotice, setVersionNotice] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionMeta[]>([]);
  const [currentVersion, setCurrentVersion] = useState<VersionMeta | null>(null);

  // Refs let the stable callbacks (showVersion in particular) read the freshest
  // version list / active id without being re-created on every render.
  const versionsRef = useRef<VersionMeta[]>(versions);
  const activeIdRef = useRef<VersionId | null>(null);

  const applyVersions = useCallback((next: VersionMeta[]) => {
    versionsRef.current = next;
    setVersions(next);
  }, []);

  const displayVersion = useCallback((version: DocVersion) => {
    activeIdRef.current = version.id;
    setCurrentVersion(metaOf(version));
    setDocs(new Map(version.docs.map((doc) => [doc.uri, doc])));
  }, []);

  const docList = useMemo(
    () => Array.from(docs.values()).sort((a, b) => a.title.localeCompare(b.title)),
    [docs],
  );

  useEffect(() => {
    let cancelled = false;

    // Boot reads the token and the version history, then eagerly loads the
    // latest version's docs — the common case (no pin / following latest), so
    // the UI hydrates without an empty flash before VersionUrlSync runs.
    const boot = Effect.gen(function* () {
      const tokens = yield* TokenStore;
      const store = yield* DocStore;
      const token = yield* tokens.get;
      const metas = yield* store.list;
      const latest = latestOf(metas);
      const latestDocs = latest ? yield* store.read(latest.id) : Option.none<DocPage[]>();
      return { token, metas, latest, latestDocs };
    });

    void runtime.runPromise(boot).then(({ token, metas, latest, latestDocs }) => {
      if (cancelled) return;
      setHasToken(token.length > 0);
      applyVersions(metas);
      const pages = Option.getOrNull(latestDocs);
      if (latest && pages && pages.length > 0) {
        activeIdRef.current = latest.id;
        setCurrentVersion(latest);
        setDocs(new Map(pages.map((doc) => [doc.uri, doc])));
        setStatus("ready");
      }
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [applyVersions]);

  const crawlIntoNewVersion = useCallback(
    (busy: DocsStatus) => {
      setStatus(busy);
      setError(null);
      setProgress(null);

      const program = Effect.gen(function* () {
        const crawler = yield* DocCrawler;
        const store = yield* DocStore;
        const pages = yield* crawler.crawl(setProgress);
        const version = yield* store.save(pages);
        const metas = yield* store.list;
        return { version, metas };
      }).pipe(
        Effect.map((value) => ({ ok: true as const, value })),
        Effect.catchTag("TokenInvalidError", () => Effect.succeed({ ok: false as const, reason: TOKEN_REJECTED })),
        Effect.catchTag("McpRequestError", (e) => Effect.succeed({ ok: false as const, reason: e.message })),
      );

      return runtime.runPromise(program).then((result) => {
        setProgress(null);
        if (result.ok) {
          applyVersions(result.value.metas);
          displayVersion(result.value.version);
          setVersionNotice(null);
          setStatus("ready");
        } else {
          setStatus("error");
          setError(result.reason);
        }
        return result;
      });
    },
    [applyVersions, displayVersion],
  );

  const connect = useCallback(
    async (token: string): Promise<boolean> => {
      await runtime.runPromise(
        Effect.gen(function* () {
          const tokens = yield* TokenStore;
          yield* tokens.set(token);
        }),
      );
      const result = await crawlIntoNewVersion("connecting");
      if (result.ok) {
        setHasToken(true);
        return true;
      }
      return false;
    },
    [crawlIntoNewVersion],
  );

  const reload = useCallback(async (): Promise<void> => {
    await crawlIntoNewVersion("refreshing");
  }, [crawlIntoNewVersion]);

  const showVersion = useCallback(async (requestedId: VersionId | null): Promise<void> => {
    const resolution = resolveVersion(versionsRef.current, requestedId);

    if (resolution._tag === "Empty") {
      activeIdRef.current = null;
      setCurrentVersion(null);
      setDocs(new Map());
      setVersionNotice(null);
      return;
    }

    const { meta } = resolution;
    if (activeIdRef.current !== meta.id) {
      activeIdRef.current = meta.id;
      const stored = await runtime.runPromise(readVersionDocs(meta.id));
      // A newer showVersion call may have superseded us while reading.
      if (activeIdRef.current !== meta.id) return;
      const pages = Option.getOrNull(stored) ?? [];
      setCurrentVersion(meta);
      setDocs(new Map(pages.map((doc) => [doc.uri, doc])));
      setStatus((s) => (s === "idle" ? "ready" : s));
    } else {
      setCurrentVersion(meta);
    }

    setVersionNotice(resolution._tag === "Fallback" ? VERSION_MISSING : null);
  }, []);

  const removeVersion = useCallback(
    async (id: VersionId): Promise<void> => {
      const metas = await runtime.runPromise(
        Effect.gen(function* () {
          const store = yield* DocStore;
          yield* store.remove(id);
          return yield* store.list;
        }),
      );
      applyVersions(metas);
      // If the deleted version was on screen, drop to the latest (or empty).
      if (activeIdRef.current === id) {
        activeIdRef.current = null;
        await showVersion(null);
      }
    },
    [applyVersions, showVersion],
  );

  const ensureDoc = useCallback(
    async (uri: string): Promise<void> => {
      if (docs.has(uri)) return;

      const program = Effect.gen(function* () {
        const mcp = yield* McpClient;
        yield* mcp.initialize;
        const text = yield* mcp.fetchDoc(uri);
        return toDocPage(uri, text);
      }).pipe(
        Effect.map((doc) => ({ ok: true as const, doc })),
        Effect.catchTag("TokenInvalidError", () => Effect.succeed({ ok: false as const, reason: TOKEN_REJECTED })),
        Effect.catchTag("McpRequestError", (e) => Effect.succeed({ ok: false as const, reason: e.message })),
      );

      const result = await runtime.runPromise(program);
      if (result.ok) {
        setDocs((current) => new Map(current).set(result.doc.uri, result.doc));
      } else {
        setError(result.reason);
      }
    },
    [docs],
  );

  const signOut = useCallback((): void => {
    // Wipe every trace of local data: the stored token and every version.
    void runtime.runPromise(
      Effect.gen(function* () {
        const tokens = yield* TokenStore;
        const store = yield* DocStore;
        yield* tokens.clear;
        yield* store.clear;
      }),
    );
    activeIdRef.current = null;
    applyVersions([]);
    setHasToken(false);
    setDocs(new Map());
    setCurrentVersion(null);
    setStatus("idle");
    setError(null);
    setVersionNotice(null);
    setProgress(null);
  }, [applyVersions]);

  // In the desktop app, "Log Out" lives in the menu bar (File > Log Out, see
  // tauri/src/lib.rs), which emits this event. The web build keeps its sidebar
  // button instead, so this listener is native-only.
  useEffect(() => {
    if (!isTauri) return;
    const unlisten = listen("menu:logout", () => signOut());
    return () => {
      void unlisten.then((un) => un());
    };
  }, [signOut]);

  const value: DocsContextValue = {
    hydrated,
    hasToken,
    docs,
    docList,
    status,
    progress,
    error,
    versionNotice,
    versions,
    currentVersion,
    connect,
    reload,
    showVersion,
    removeVersion,
    ensureDoc,
    signOut,
  };

  return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;
}

export function useDocs(): DocsContextValue {
  const value = useContext(DocsContext);
  if (!value) {
    throw new Error("useDocs must be used within <DocsProvider>");
  }
  return value;
}
