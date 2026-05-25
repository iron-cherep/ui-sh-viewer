import { Loader2 } from "lucide-react";
import type { CSSProperties } from "react";
import { type CrawlProgress } from "../effect/services/DocCrawler";
import { getDocPath } from "../lib/docs";

function percentOf(progress: CrawlProgress | null): number {
  if (!progress || progress.total <= 0) return 0;
  return Math.min(100, Math.round((progress.done / progress.total) * 100));
}

/** Full-page progress shown while the first crawl runs (onboarding / cold start). */
export function FetchProgressPage({ progress }: { progress: CrawlProgress | null }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <div className="w-full max-w-md text-center">
        <Loader2 className="mx-auto size-7 animate-spin stroke-accent" />
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-balance text-white">Fetching documentation</h1>
        <p className="mt-2 text-sm/6 text-pretty text-zinc-400">
          Reading the ui.sh documentation graph one page at a time.
        </p>
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full w-(--progress) rounded-full bg-accent transition-[width] duration-300"
            style={{ "--progress": `${percentOf(progress)}%` } as CSSProperties}
          />
        </div>
        <p className="mt-3 truncate font-mono text-xs/5 tabular-nums text-zinc-500">
          {progress ? `${getDocPath(progress.uri)} · ${progress.done}/${progress.total}` : "Connecting…"}
        </p>
      </div>
    </div>
  );
}

/** Slim top bar shown when refreshing while existing docs stay visible. */
export function FetchProgressBar({ progress }: { progress: CrawlProgress | null }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-accent/5 px-5 py-2 sm:px-6 lg:px-8">
      <Loader2 className="size-4 shrink-0 animate-spin stroke-accent" />
      <p className="min-w-0 truncate font-mono text-xs/5 tabular-nums text-zinc-400">
        {progress ? `Refreshing · ${getDocPath(progress.uri)} (${progress.done}/${progress.total})` : "Refreshing…"}
      </p>
    </div>
  );
}
