import clsx from "clsx";
import {
  ChevronRight,
  Clock,
  FileText,
  Folder,
  House,
  LogOut,
  RefreshCw,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDocs } from "../app/DocsProvider";
import { useVersionedNav } from "../app/version-nav";
import { getChildDocs, getNavigationDocs, uriToPath } from "../lib/docs";
import { formatTimestampShort } from "../lib/format";

/** Left navigation: brand, the current version + history, and a searchable doc list. */
export function Sidebar({ activeUri, onNavigate }: { activeUri: string | null; onNavigate?: () => void }) {
  const { docList, status, versions, currentVersion, reload, signOut } = useDocs();
  const { go: navigate, pin, pinVersion } = useVersionedNav();
  const [query, setQuery] = useState("");
  const loading = status === "connecting" || status === "refreshing";
  const latestId = versions[0]?.id ?? null;
  const pinnedToOlder = pin !== null && currentVersion !== null && currentVersion.id !== latestId;

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized) {
      return docList.filter((doc) => `${doc.title} ${doc.uri} ${doc.text}`.toLowerCase().includes(normalized));
    }
    return getNavigationDocs(activeUri, docList);
  }, [activeUri, docList, query]);

  function go(to: string) {
    navigate(to);
    onNavigate?.();
  }

  async function fetchLatest() {
    await reload();
    pinVersion(null, { replace: true });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-white">UI.SH MCP Viewer</h1>
          <span className="inline-flex items-center rounded bg-white/5 px-1.5 py-0.5 text-[0.6875rem]/4 font-medium text-zinc-400 ring-1 ring-white/10">
            Unofficial
          </span>
        </div>
        <p className="mt-1.5 text-xs/5 text-zinc-400">Browse the ui.sh MCP documentation graph</p>
      </div>

      <div className="mt-6">
        <p className="px-2 text-[0.6875rem]/4 font-medium tracking-wide text-zinc-500 uppercase">Current version</p>
        <div className="mt-0.5 flex items-center gap-2 px-2">
          <p className="truncate text-sm/6 font-medium tabular-nums text-white">
            {currentVersion ? formatTimestampShort(currentVersion.savedAt) : "No version yet"}
          </p>
          {currentVersion && pinnedToOlder ? (
            <span className="inline-flex shrink-0 items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[0.625rem]/4 font-medium text-amber-300 ring-1 ring-amber-500/20">
              Pinned
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void fetchLatest()}
            disabled={loading}
            aria-label="Fetch the latest docs"
            title="Fetch the latest docs"
            className="-mr-1 ml-auto inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50"
          >
            <RefreshCw className={clsx("size-4", loading && "animate-spin")} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => go("/versions")}
          className={clsx(
            "mt-2 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
            activeUri === "uidotsh://versions"
              ? "bg-zinc-900 text-white ring-1 ring-white/10"
              : "text-zinc-300 hover:bg-white/5 hover:text-white",
          )}
        >
          <Clock
            className={clsx(
              "size-4 shrink-0",
              activeUri === "uidotsh://versions" ? "stroke-zinc-200" : "stroke-zinc-500",
            )}
          />
          <span className="flex-1 truncate text-sm/6 font-medium">Version history</span>
          {versions.length ? (
            <span className="flex shrink-0 items-center gap-1 text-xs/5 text-zinc-500">
              <span className="tabular-nums">{versions.length}</span>
              <ChevronRight className="size-4 stroke-zinc-600" />
            </span>
          ) : null}
        </button>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col border-t border-white/10 pt-5">
        <label className="relative block">
          <span className="sr-only">Search documentation</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 stroke-zinc-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search docs"
            className="w-full rounded-lg bg-zinc-900 py-2 pr-3 pl-9 text-sm/6 text-white ring-1 ring-white/10 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-accent"
          />
        </label>

        <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-auto pr-1">
          {!query ? <NavItem icon={House} title="Home" active={activeUri === null} onClick={() => go("/")} /> : null}
          {items.length ? (
            items.map((doc) => {
              const childCount = getChildDocs(doc.uri, docList).length;
              const isGroup = childCount > 0;
              return (
                <NavItem
                  key={doc.uri}
                  icon={isGroup ? Folder : FileText}
                  title={doc.title}
                  count={isGroup ? childCount : undefined}
                  active={activeUri === doc.uri}
                  onClick={() => go(uriToPath(doc.uri))}
                />
              );
            })
          ) : (
            <p className="px-2 text-sm/6 text-zinc-500">No documents.</p>
          )}
        </nav>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={signOut}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs/5 text-zinc-500 transition hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <LogOut className="size-3.5" />
          Logout
        </button>
      </div>
    </div>
  );
}

/**
 * A single nav entry. A `count` marks it as a group (accent folder icon + page
 * count + chevron); without one it's a single page (muted file icon).
 */
function NavItem({
  icon: Icon,
  title,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  const isGroup = count !== undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
        active ? "bg-zinc-900 text-white ring-1 ring-white/10" : "text-zinc-300 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon
        className={clsx("size-4 shrink-0", isGroup ? "stroke-accent" : active ? "stroke-zinc-200" : "stroke-zinc-500")}
      />
      <span className="flex-1 truncate text-sm/6 font-medium">{title}</span>
      {isGroup ? (
        <span className="flex shrink-0 items-center gap-1 text-xs/5 text-zinc-500">
          <span className="tabular-nums">{count}</span>
          <ChevronRight className="size-4 stroke-zinc-600" />
        </span>
      ) : null}
    </button>
  );
}
