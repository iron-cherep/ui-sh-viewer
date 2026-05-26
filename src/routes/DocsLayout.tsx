import { AlertTriangle, Loader2, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDocs } from "../app/DocsProvider";
import { VersionUrlSync } from "../app/version-nav";
import { FetchProgressBar, FetchProgressPage } from "../components/FetchProgress";
import { FrameBox } from "../components/Frame";
import { Sidebar } from "../components/Sidebar";
import { pathToUri } from "../lib/docs";

/** Framed app shell: sidebar + scrolling content. Guards access and shows crawl progress. */
export function DocsLayout() {
  const { hydrated, hasToken, docs, status, progress, versionNotice, versions, reload } = useDocs();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const autoFetched = useRef(false);
  const activeUri = pathToUri(location.pathname);

  // Have a token but no stored versions yet (first run / history cleared) → fetch once.
  useEffect(() => {
    if (hydrated && hasToken && versions.length === 0 && status === "idle" && !autoFetched.current) {
      autoFetched.current = true;
      void reload();
    }
    // `reload` is stable; the ref + status guard prevent re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, hasToken, versions.length, status]);

  if (!hydrated) {
    return <Splash />;
  }
  if (!hasToken) {
    return <Navigate to="/welcome" replace />;
  }

  const cold = (status === "connecting" || status === "refreshing") && docs.size === 0;

  return (
    <>
      <VersionUrlSync />
      <FrameBox className="flex">
        <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-r border-white/10 px-6 py-6 lg:flex">
          <Sidebar activeUri={activeUri} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="-m-2 rounded-lg p-2 text-zinc-300 transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Menu className="size-5" />
            </button>
            <p className="font-mono text-xs/5 tracking-wide text-accent uppercase">UI.SH MCP Viewer</p>
          </header>

          {status === "refreshing" && docs.size > 0 ? <FetchProgressBar progress={progress} /> : null}

          {versionNotice ? (
            <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs/5 text-amber-200 sm:px-6 lg:px-8">
              <AlertTriangle className="size-4 shrink-0 stroke-amber-300" />
              <span>{versionNotice}</span>
            </div>
          ) : null}

          <main className="min-w-0 flex-1 overflow-y-auto">
            {cold ? (
              <FetchProgressPage progress={progress} />
            ) : (
              <div className="px-5 py-6 sm:px-6 lg:px-8">
                <Outlet />
              </div>
            )}
          </main>
        </div>
      </FrameBox>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950 px-5 py-5 lg:hidden">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="-m-2 rounded-lg p-2 text-zinc-300 transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-2 min-h-[calc(100dvh-6rem)]">
            <Sidebar activeUri={activeUri} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Loader2 className="size-6 animate-spin stroke-accent" />
    </div>
  );
}
