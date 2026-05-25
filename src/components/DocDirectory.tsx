import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { type DocPage } from "../effect/domain";
import { getChildDocs, getDocPath, summarizeDoc, uriToPath } from "../lib/docs";

/** A grid of document/group cards — used for the index and any group page. */
export function DocDirectory({
  eyebrow,
  title,
  description,
  items,
  allDocs,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: DocPage[];
  allDocs: DocPage[];
}) {
  return (
    <div>
      <header className="border-b border-white/10 pb-5">
        <p className="font-mono text-xs/5 tracking-wide text-accent uppercase">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-[68ch] text-sm/6 text-pretty text-zinc-400">{description}</p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((doc) => {
          const childCount = getChildDocs(doc.uri, allDocs).length;
          return (
            <Link
              key={doc.uri}
              to={uriToPath(doc.uri)}
              className="group rounded-xl bg-zinc-900 p-4 ring-1 ring-white/10 transition hover:bg-zinc-800/60 hover:ring-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm/6 font-semibold text-white">{doc.title}</h2>
                  <p className="mt-1 truncate font-mono text-xs/5 text-zinc-500">{getDocPath(doc.uri)}</p>
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 stroke-zinc-500 transition group-hover:stroke-accent" />
              </div>
              <p className="mt-3 line-clamp-2 text-sm/6 text-zinc-400">
                {doc.error ? doc.error : summarizeDoc(doc.text)}
              </p>
              {childCount ? (
                <p className="mt-3 text-sm/6 font-medium text-accent">
                  {childCount} {childCount === 1 ? "page" : "pages"}
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
