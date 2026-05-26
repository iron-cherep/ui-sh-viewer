import clsx from "clsx";
import { Check, Eye, RefreshCw, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useDocs } from "../app/DocsProvider";
import { useVersionedNav } from "../app/version-nav";
import { AccentButton } from "../components/AccentButton";
import { type VersionMeta } from "../effect/domain";
import { formatTimestamp } from "../lib/format";
import { setVersionParam } from "../lib/versions";

/** Manage stored documentation versions: view, pin, fetch a new one, or remove. */
export function VersionHistory() {
  const { versions, currentVersion, status, reload, removeVersion } = useDocs();
  const { pin, pinVersion } = useVersionedNav();
  const navigate = useNavigate();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const loading = status === "connecting" || status === "refreshing";
  const latestId = versions[0]?.id ?? null;

  // Open a version's docs, pinning it in the URL (clearing the pin for latest).
  function view(meta: VersionMeta) {
    const isLatest = meta.id === latestId;
    navigate({ pathname: "/", search: isLatest ? "" : `?${setVersionParam(new URLSearchParams(), meta.id)}` });
  }

  async function remove(id: string) {
    setConfirmingId(null);
    await removeVersion(id);
    // If the pinned version was the one we deleted, fall back to latest cleanly.
    if (pin === id) pinVersion(null, { replace: true });
  }

  async function fetchLatest() {
    await reload();
    pinVersion(null, { replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="font-mono text-xs/5 tracking-wide text-accent uppercase">History</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
            Version history
          </h1>
          <p className="mt-2 max-w-[60ch] text-sm/6 text-pretty text-zinc-400">
            Every fetch is kept on this device. Open an earlier snapshot, or pull the latest docs into a new version.
          </p>
        </div>
        <AccentButton disabled={loading} onClick={() => void fetchLatest()}>
          <RefreshCw className={clsx("size-4", loading && "animate-spin")} />
          {loading ? "Fetching…" : "Fetch latest"}
        </AccentButton>
      </header>

      {versions.length === 0 ? (
        <p className="mt-8 text-sm/6 text-zinc-400">
          No versions stored yet. Fetch the latest docs to start your history.
        </p>
      ) : (
        <ul role="list" className="mt-2 divide-y divide-white/10">
          {versions.map((version) => {
            const isLatest = version.id === latestId;
            const isCurrent = currentVersion?.id === version.id;
            const confirming = confirmingId === version.id;
            return (
              <li key={version.id} className="flex items-center gap-4 py-4">
                <span
                  aria-hidden
                  className={clsx(
                    "size-2 shrink-0 rounded-full",
                    isCurrent ? "bg-accent" : "bg-transparent ring-1 ring-zinc-600",
                  )}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm/6 font-medium tabular-nums text-white">{formatTimestamp(version.savedAt)}</p>
                    {isLatest ? <Badge tone="accent">Latest</Badge> : null}
                    {isCurrent ? <Badge tone="muted">Current</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-xs/5 tabular-nums text-zinc-500">
                    {version.docCount} {version.docCount === 1 ? "document" : "documents"}
                  </p>
                </div>

                {confirming ? (
                  <div className="flex items-center gap-1">
                    <span className="mr-1 hidden text-xs/5 text-zinc-400 sm:inline">Remove?</span>
                    <button
                      type="button"
                      onClick={() => void remove(version.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-2 py-1.5 text-xs/5 font-medium text-rose-300 ring-1 ring-rose-500/20 transition hover:bg-rose-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                    >
                      <Check className="size-3.5" />
                      Delete
                    </button>
                    <IconButton label="Cancel" onClick={() => setConfirmingId(null)}>
                      <X className="size-4" />
                    </IconButton>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {isCurrent ? null : (
                      <button
                        type="button"
                        onClick={() => view(version)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs/5 font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <Eye className="size-3.5" />
                        View
                      </button>
                    )}
                    <IconButton label="Remove version" onClick={() => setConfirmingId(version.id)} danger>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: "accent" | "muted" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[0.6875rem]/4 font-medium ring-1",
        tone === "accent" ? "bg-accent/10 text-accent ring-accent/20" : "bg-white/5 text-zinc-300 ring-white/10",
      )}
    >
      {children}
    </span>
  );
}

function IconButton({
  children,
  label,
  onClick,
  danger,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg p-2 text-zinc-500 transition focus-visible:outline-2 focus-visible:outline-offset-2",
        danger
          ? "hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-rose-400"
          : "hover:bg-white/5 hover:text-white focus-visible:outline-accent",
      )}
    >
      {children}
    </button>
  );
}
