import { Effect, Option } from "effect";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type DocPage } from "../effect/domain";
import { DocCache } from "../effect/services/DocCache";
import { DocCrawler, type CrawlProgress } from "../effect/services/DocCrawler";
import { McpClient } from "../effect/services/McpClient";
import { TokenStore } from "../effect/services/TokenStore";
import { toDocPage } from "../lib/docs";
import { runtime } from "./runtime";

const TOKEN_REJECTED = "That access token was rejected. Double-check it and try again.";

export type DocsStatus = "idle" | "connecting" | "ready" | "refreshing" | "error";

type DocsContextValue = {
  /** True once the initial token + cache read has finished. */
  hydrated: boolean;
  hasToken: boolean;
  docs: Map<string, DocPage>;
  docList: DocPage[];
  status: DocsStatus;
  progress: CrawlProgress | null;
  error: string | null;
  /** Save the token and crawl. Resolves true on success. */
  connect: (token: string) => Promise<boolean>;
  /** Re-crawl, keeping the current docs visible until it succeeds. */
  refresh: () => Promise<void>;
  /** Fetch a single doc if it isn't already loaded. */
  ensureDoc: (uri: string) => Promise<void>;
  /** Forget the token and loaded docs. */
  signOut: () => void;
};

const DocsContext = createContext<DocsContextValue | null>(null);

export function DocsProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [docs, setDocs] = useState<Map<string, DocPage>>(() => new Map());
  const [status, setStatus] = useState<DocsStatus>("idle");
  const [progress, setProgress] = useState<CrawlProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const docList = useMemo(
    () => Array.from(docs.values()).sort((a, b) => a.title.localeCompare(b.title)),
    [docs],
  );

  useEffect(() => {
    let cancelled = false;

    const boot = Effect.gen(function* () {
      const tokens = yield* TokenStore;
      const cache = yield* DocCache;
      const token = yield* tokens.get;
      const cached = yield* cache.read;
      return { token, docs: Option.getOrNull(cached) };
    });

    void runtime.runPromise(boot).then(({ token, docs: cachedDocs }) => {
      if (cancelled) return;
      setHasToken(token.length > 0);
      if (cachedDocs && cachedDocs.length > 0) {
        setDocs(new Map(cachedDocs.map((doc) => [doc.uri, doc])));
        setStatus("ready");
      }
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function connect(token: string): Promise<boolean> {
    setStatus("connecting");
    setError(null);
    setProgress(null);

    const program = Effect.gen(function* () {
      const tokens = yield* TokenStore;
      const crawler = yield* DocCrawler;
      const cache = yield* DocCache;
      yield* tokens.set(token);
      const pages = yield* crawler.crawl(setProgress);
      yield* cache.write(pages);
      return pages;
    }).pipe(
      Effect.map((pages) => ({ ok: true as const, pages })),
      Effect.catchTag("TokenInvalidError", () => Effect.succeed({ ok: false as const, reason: TOKEN_REJECTED })),
      Effect.catchTag("McpRequestError", (e) => Effect.succeed({ ok: false as const, reason: e.message })),
    );

    const result = await runtime.runPromise(program);
    setProgress(null);

    if (result.ok) {
      setDocs(new Map(result.pages.map((doc) => [doc.uri, doc])));
      setHasToken(true);
      setStatus("ready");
      return true;
    }

    setStatus("error");
    setError(result.reason);
    return false;
  }

  async function refresh(): Promise<void> {
    setStatus("refreshing");
    setError(null);
    setProgress(null);

    const program = Effect.gen(function* () {
      const crawler = yield* DocCrawler;
      const cache = yield* DocCache;
      const pages = yield* crawler.crawl(setProgress);
      yield* cache.write(pages);
      return pages;
    }).pipe(
      Effect.map((pages) => ({ ok: true as const, pages })),
      Effect.catchTag("TokenInvalidError", () => Effect.succeed({ ok: false as const, reason: TOKEN_REJECTED })),
      Effect.catchTag("McpRequestError", (e) => Effect.succeed({ ok: false as const, reason: e.message })),
    );

    const result = await runtime.runPromise(program);
    setProgress(null);

    if (result.ok) {
      setDocs(new Map(result.pages.map((doc) => [doc.uri, doc])));
      setStatus("ready");
    } else {
      setStatus("error");
      setError(result.reason);
    }
  }

  async function ensureDoc(uri: string): Promise<void> {
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
  }

  function signOut(): void {
    // Wipe every trace of local data: the stored token and the cached docs.
    void runtime.runPromise(
      Effect.gen(function* () {
        const tokens = yield* TokenStore;
        const cache = yield* DocCache;
        yield* tokens.clear;
        yield* cache.clear;
      }),
    );
    setHasToken(false);
    setDocs(new Map());
    setStatus("idle");
    setError(null);
    setProgress(null);
  }

  const value: DocsContextValue = {
    hydrated,
    hasToken,
    docs,
    docList,
    status,
    progress,
    error,
    connect,
    refresh,
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
