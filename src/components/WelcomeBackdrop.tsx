import { ChevronRight, FileText, Folder, House, RefreshCw, Search, type LucideIcon } from "lucide-react";
import { AccentButton } from "./AccentButton";

/**
 * A purely decorative, static stand-in for the real app shell (sidebar + doc
 * grid). It renders fixed dummy content — never wired to `useDocs` — so the
 * onboarding modal has a believable layout to float over while blurred.
 * The dummy copy hides a few puns for anyone who looks too closely.
 */
export function WelcomeBackdrop() {
  return (
    <div className="flex h-full">
      <aside className="hidden w-80 shrink-0 flex-col overflow-hidden border-r border-white/10 px-6 py-6 lg:flex">
        <DummySidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 lg:hidden">
          <p className="font-mono text-xs/5 tracking-wide text-accent uppercase">UI.SH MG</p>
        </header>
        <main className="min-w-0 flex-1 overflow-hidden">
          <div className="px-5 py-6 sm:px-6 lg:px-8">
            <DummyDirectory />
          </div>
        </main>
      </div>
    </div>
  );
}

const NAV_ITEMS: { icon: LucideIcon; title: string; count?: number; active?: boolean }[] = [
  { icon: House, title: "Home", active: true },
  { icon: Folder, title: "Getting Started, Eventually", count: 7 },
  { icon: Folder, title: "Hooks, Line & Sinker", count: 9 },
  { icon: Folder, title: "The Lit Components", count: 12 },
  { icon: Folder, title: "Async & Ye Shall Receive", count: 4 },
  { icon: FileText, title: "State of Emergency" },
  { icon: FileText, title: "The DOM-fic Empire" },
  { icon: FileText, title: "Recursion (see Recursion)" },
];

function DummySidebar() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-white">UI.SH MG</h1>
          <span className="inline-flex items-center rounded bg-white/5 px-1.5 py-0.5 text-[0.6875rem]/4 font-medium text-zinc-400 ring-1 ring-white/10">
            Unofficial
          </span>
        </div>
        <p className="mt-1.5 text-xs/5 text-zinc-400">UI.SH&rsquo;s Missing GUI</p>
      </div>

      <AccentButton className="mt-6 w-full" tabIndex={-1}>
        <RefreshCw className="size-4" />
        Refresh docs
      </AccentButton>

      <div className="mt-6 flex min-h-0 flex-1 flex-col border-t border-white/10 pt-5">
        <div className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 stroke-zinc-500" />
          <div className="w-full rounded-lg bg-zinc-900 py-2 pr-3 pl-9 text-sm/6 text-zinc-500 ring-1 ring-white/10">
            Search docs
          </div>
        </div>

        <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-hidden pr-1">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.title} {...item} />
          ))}
        </nav>
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  title,
  count,
  active,
}: {
  icon: LucideIcon;
  title: string;
  count?: number;
  active?: boolean;
}) {
  const isGroup = count !== undefined;
  return (
    <div
      className={
        active
          ? "flex w-full items-center gap-2.5 rounded-lg bg-zinc-900 px-2 py-2 text-left text-white ring-1 ring-white/10"
          : "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-zinc-300"
      }
    >
      <Icon className={isGroup ? "size-4 shrink-0 stroke-accent" : "size-4 shrink-0 stroke-zinc-500"} />
      <span className="flex-1 truncate text-sm/6 font-medium">{title}</span>
      {isGroup ? (
        <span className="flex shrink-0 items-center gap-1 text-xs/5 text-zinc-500">
          <span className="tabular-nums">{count}</span>
          <ChevronRight className="size-4 stroke-zinc-600" />
        </span>
      ) : null}
    </div>
  );
}

const CARDS: { title: string; path: string; description: string; pages?: number }[] = [
  {
    title: "Getting Started, Eventually",
    path: "ui/intro",
    description: "Install, configure, and quietly question your life choices — all in under five minutes. Results may vary.",
  },
  {
    title: "Hooks, Line & Sinker",
    path: "ui/hooks",
    description: "useState, useEffect, useRegret. Everything you need to reel in unruly component logic without losing the plot.",
    pages: 9,
  },
  {
    title: "The Lit Components",
    path: "ui/components",
    description: "A component library so blazing fast it compiles itself. No cap — just templates and a tasteful amount of magic.",
    pages: 12,
  },
  {
    title: "Tail-winding Down",
    path: "ui/styling",
    description: "Utility-first styling for people who consider a separate CSS file a personal attack. Relax, it's all inline now.",
    pages: 8,
  },
  {
    title: "Async & Ye Shall Receive",
    path: "ui/async",
    description: "Promises you can actually keep, plus a quiet support group for recovering callback-pyramid survivors.",
    pages: 4,
  },
  {
    title: "Recursion (see Recursion)",
    path: "ui/recursion",
    description: "To understand this page, first read this page. To leave, please consult the base case — sold separately.",
  },
];

function DummyDirectory() {
  return (
    <div>
      <header className="border-b border-white/10 pb-5">
        <p className="font-mono text-xs/5 tracking-wide text-accent uppercase">/</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">
          Documentation
        </h1>
        <p className="mt-2 max-w-[68ch] text-sm/6 text-pretty text-zinc-400">
          Top-level pages and document groups.
        </p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => (
          <div key={card.path} className="rounded-xl bg-zinc-900 p-4 ring-1 ring-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm/6 font-semibold text-white">{card.title}</h2>
                <p className="mt-1 truncate font-mono text-xs/5 text-zinc-500">{card.path}</p>
              </div>
              <ChevronRight className="mt-1 size-4 shrink-0 stroke-zinc-500" />
            </div>
            <p className="mt-3 line-clamp-2 text-sm/6 text-zinc-400">{card.description}</p>
            {card.pages ? <p className="mt-3 text-sm/6 font-medium text-accent">{card.pages} pages</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
